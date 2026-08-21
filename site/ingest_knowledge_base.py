"""
One-off ingestion script: chunk cussator-knowledge-base.md, embed each chunk
with OpenAI, and upsert into Supabase (pgvector). Run manually whenever the
knowledge base file changes:

    python ingest_knowledge_base.py

Requires SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, OPENAI_API_KEY in .env,
and the `knowledge_chunks` table + `match_knowledge_chunks` function already
created via supabase_schema.sql (run once in the Supabase SQL Editor).
"""

import os
import re
import sys
from pathlib import Path

from openai import OpenAI
from supabase import create_client

SITE_DIR = Path(__file__).parent
ENV_FILE = SITE_DIR / ".env"
KB_FILE = SITE_DIR / "cussator-knowledge-base.md"

EMBEDDING_MODEL = "text-embedding-3-small"
MAX_CHUNK_CHARS = 1200
OVERLAP_CHARS = 150
EMBED_BATCH_SIZE = 50


def load_env():
    if not ENV_FILE.exists():
        return
    for line in ENV_FILE.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, _, value = line.partition("=")
        key, value = key.strip(), value.strip()
        if key and value and key not in os.environ:
            os.environ[key] = value


def split_into_sections(text):
    """Split markdown into (heading, section_text) chunks on '#' headers."""
    lines = text.split("\n")
    sections = []
    heading = None
    buf = []
    for line in lines:
        if re.match(r"^#{1,6}\s", line):
            if buf:
                sections.append((heading, "\n".join(buf).strip()))
            heading = line.lstrip("#").strip()
            buf = [line]
        else:
            buf.append(line)
    if buf:
        sections.append((heading, "\n".join(buf).strip()))
    return [(h, s) for h, s in sections if s.strip()]


def chunk_section(section_text):
    """Split an over-long section into overlapping paragraph-aligned chunks."""
    if len(section_text) <= MAX_CHUNK_CHARS:
        return [section_text]

    paragraphs = re.split(r"\n\s*\n", section_text)
    chunks = []
    buf = ""
    for para in paragraphs:
        if len(buf) + len(para) + 2 <= MAX_CHUNK_CHARS:
            buf = (buf + "\n\n" + para).strip() if buf else para
            continue
        if buf:
            chunks.append(buf)
        overlap = buf[-OVERLAP_CHARS:] if buf else ""
        buf = (overlap + "\n\n" + para).strip()
        while len(buf) > MAX_CHUNK_CHARS:
            chunks.append(buf[:MAX_CHUNK_CHARS])
            buf = buf[MAX_CHUNK_CHARS - OVERLAP_CHARS:]
    if buf:
        chunks.append(buf)
    return chunks


def build_chunks(markdown_text):
    chunks = []
    for heading, section_text in split_into_sections(markdown_text):
        for piece in chunk_section(section_text):
            chunks.append({"content": piece, "source": heading or KB_FILE.name})
    return chunks


def embed_all(client, texts):
    embeddings = []
    for i in range(0, len(texts), EMBED_BATCH_SIZE):
        batch = texts[i:i + EMBED_BATCH_SIZE]
        resp = client.embeddings.create(model=EMBEDDING_MODEL, input=batch)
        embeddings.extend(item.embedding for item in resp.data)
        print(f"  embedded {min(i + EMBED_BATCH_SIZE, len(texts))}/{len(texts)}")
    return embeddings


def main():
    load_env()

    missing = [k for k in ("SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY", "OPENAI_API_KEY") if not os.environ.get(k)]
    if missing:
        print(f"Missing env vars: {', '.join(missing)}. Add them to .env and re-run.", file=sys.stderr)
        sys.exit(1)

    if not KB_FILE.exists():
        print(f"Knowledge base file not found: {KB_FILE}", file=sys.stderr)
        sys.exit(1)

    markdown_text = KB_FILE.read_text(encoding="utf-8")
    chunks = build_chunks(markdown_text)
    if not chunks:
        print("No chunks produced from the knowledge base file — is it empty?", file=sys.stderr)
        sys.exit(1)
    print(f"Split {KB_FILE.name} into {len(chunks)} chunks.")

    openai_client = OpenAI()
    print(f"Embedding {len(chunks)} chunks with {EMBEDDING_MODEL}...")
    embeddings = embed_all(openai_client, [c["content"] for c in chunks])

    rows = [
        {
            "content": chunk["content"],
            "source": chunk["source"],
            "chunk_index": i,
            "embedding": embedding,
        }
        for i, (chunk, embedding) in enumerate(zip(chunks, embeddings))
    ]

    supabase = create_client(os.environ["SUPABASE_URL"], os.environ["SUPABASE_SERVICE_ROLE_KEY"])

    print("Clearing existing knowledge_chunks rows...")
    supabase.table("knowledge_chunks").delete().neq("id", 0).execute()

    print(f"Inserting {len(rows)} rows into Supabase...")
    for i in range(0, len(rows), 100):
        supabase.table("knowledge_chunks").insert(rows[i:i + 100]).execute()

    print("Done.")


if __name__ == "__main__":
    main()

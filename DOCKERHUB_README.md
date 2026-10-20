# AI Paperless Organizer

🤖 **Cleanup companion for a grown Paperless-ngx archive** – merge duplicate correspondents, tags and document types, tag wizard, re-OCR with local vision models, duplicate invoices, classification, chat.

📖 [GitHub](https://github.com/web-dienste/AI-Paperless-Organizer) · 🇬🇧 [English README](https://github.com/web-dienste/AI-Paperless-Organizer/blob/main/README.en.md) · 🇩🇪 [Deutsche README](https://github.com/web-dienste/AI-Paperless-Organizer/blob/main/README.md) · 🐛 [Issues](https://github.com/web-dienste/AI-Paperless-Organizer/issues)

> **⚠️ Beta – always make a full Paperless-ngx backup before use.** This tool modifies documents, tags, correspondents and metadata in your Paperless instance. No warranty, no liability.

> **🔒 No login:** the Organizer has no authentication of its own. Run it on your home network or behind a VPN only. **The UI is German only.** Images are `amd64` only.

## Compatibility

**Works with Paperless-ngx 2.x and 3.x.** Last verified against **3.3.1**, reading and writing.

## Features

- **✨ AI classifier** – title, tags, correspondent, document type, date, storage path and custom fields, filled in automatically from document content. Fully automatic, semi-automatic or manual.
- **🧠 Metadata cleanup** – find and merge duplicate correspondents, tags and document types
- **🧹 Tag Cleanup Wizard** – 5-step systematic tag cleanup (empty, junk, misfiled, similar)
- **📷 OCR with Ollama Vision** – re-OCR documents with local vision models; single, batch and background watchdog
- **🏆 Model benchmark** – compare up to 5 OCR models or 4 LLM providers on the same document, with AI quality grading
- **💬 Document chat (RAG)** – ask your archive questions, answered with source attribution (BM25 + semantic hybrid search + reranking)
- **☁️ Cloud sync / import** – Google Drive, OneDrive, Dropbox, Nextcloud/WebDAV and local folders → Paperless
- **🔍 Duplicate detection** – checksums, AI embeddings and duplicate-invoice detection
- **🗑️ Junk cleanup** – find and remove boilerplate documents (T&C, imprints, ...)

## 🔒 Privacy

What gets sent to the LLM depends on the feature:

| Feature | Sent to the LLM |
|---|---|
| **Metadata cleanup & Tag Wizard** | **Only metadata names** – tags, correspondents, document types and their document counts. No document content. |
| **AI classifier** | The **OCR text** of the document being classified |
| **Document chat (RAG)** | The **text chunks** retrieved for your question |
| **OCR** | The **page images** being transcribed |

👉 With **Ollama**, no document content leaves your network.

## Supported LLM providers

OpenAI · Mistral · OpenRouter · Anthropic · Azure OpenAI · **Ollama** (local, recommended for maximum privacy)

## Quick start

```yaml
# docker-compose.yml
services:
  backend:
    image: webdienste/ai-paperless-organizer:backend-latest
    volumes:
      - ./data:/app/data
    extra_hosts:
      - "host.docker.internal:host-gateway"   # lets the container reach the Docker host (Linux)
    restart: unless-stopped

  frontend:
    image: webdienste/ai-paperless-organizer:frontend-latest
    ports:
      - "3001:80"
    depends_on:
      - backend
    restart: unless-stopped
```

```bash
docker compose up -d
```

Then open `http://<your-server>:3001`. The backend needs no published port: the frontend proxies `/api` internally, so it stays clear of Paperless on port 8000. The services must be named `backend` and `frontend`.

Step-by-step guide with all AI settings (German): [docs/QUICKSTART.md](https://github.com/web-dienste/AI-Paperless-Organizer/blob/main/docs/QUICKSTART.md)

## Configuration

1. **Paperless-ngx connection** – enter your URL and API token (*Paperless admin → Auth Tokens*)
2. **LLM provider** – pick a provider and enter the API key (Ollama needs none)
3. **Done** – enable the classifier fields you want, pick an OCR model, build the RAG index

## Screenshots

![Dashboard](https://raw.githubusercontent.com/web-dienste/AI-Paperless-Organizer/main/docs/screenshots/dashboard.png)

![Document chat](https://raw.githubusercontent.com/web-dienste/AI-Paperless-Organizer/main/docs/screenshots/dokumentenchat.png)

![OCR Stats](https://raw.githubusercontent.com/web-dienste/AI-Paperless-Organizer/main/docs/screenshots/ocr-stats.png)

## Tags

- `backend-latest` – Backend API (FastAPI / Python)
- `frontend-latest` – Frontend UI (React / Vite)

---

MIT licensed. Made with ❤️ for the Paperless-ngx community.

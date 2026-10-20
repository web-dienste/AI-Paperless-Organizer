# Quickstart

Du musst das nicht lesen. Es spart dir aber die Stellen, an denen man beim ersten Mal sucht: wo die KI eingestellt wird und welche Adresse Ollama im Docker-Container braucht.

Stand: Oktober 2026. Oberfläche und Standard-Prompts sind deutsch.

## 1. Was du brauchst

- **Paperless-ngx** 2.x oder 3.x und einen API-Token (in Paperless: dein Benutzer oben rechts → Mein Profil, oder im Admin-Bereich unter Auth Tokens).
- **Docker mit Compose** auf einem x86-64-Rechner. Die fertigen Images gibt es nur für `amd64`, also nicht für Raspberry Pi oder ARM-NAS.
- **Eine KI**: [Ollama](https://ollama.com) auf einem Rechner mit Grafikkarte oder ein API-Key (OpenAI, Mistral, OpenRouter, Anthropic). Ollama darf auf einem anderen Rechner laufen als der Organizer.
- **Ein Backup von Paperless.** Das Tool ändert und löscht Daten in deinem Archiv.

Ohne KI funktionieren schon: „Unerwünschte Dokumente", exakte Duplikate und das Löschen leerer Tags.

## 2. Starten

```yaml
# docker-compose.yml
services:
  backend:
    image: webdienste/ai-paperless-organizer:backend-latest
    volumes:
      - ./data:/app/data
    extra_hosts:
      - "host.docker.internal:host-gateway"   # damit der Container den Docker-Host erreicht (Linux)
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

Die Oberfläche liegt dann unter `http://<dein-server>:3001`. Der erste Start des Backends kann eine Minute dauern. Die Dienste müssen `backend` und `frontend` heißen.

Das Backend braucht keinen eigenen Port nach außen, die Oberfläche reicht `/api` intern durch. Nur für Google Drive, OneDrive oder Dropbox kommt beim Backend `ports: ["53682:53683"]` dazu (Anmeldung beim Cloud-Anbieter).

Wer selbst baut (`git clone`, dann `docker compose up -d --build`), landet auf Port **8088**, und die Daten liegen in `./backend/data`.

## 3. Paperless verbinden

**Einstellungen → Paperless-ngx Verbindung**: „Paperless URL" ohne `/api` und den „API Token" eintragen, dann „Speichern & Testen". Danach die Seite einmal neu laden. Oben links muss „Paperless verbunden" stehen.

Die Adresse wird doppelt benutzt: vom Container für die API und von deinem Browser für Vorschaubilder und Links. Nimm deshalb die LAN-IP oder Domain (`http://192.168.x.y:8000`, `https://paperless.example.com`), nicht `localhost`.

## 4. KI einrichten

### Welche Funktion nimmt welche Einstellung?

Die KI wird nicht an einer Stelle eingestellt, sondern je Bereich:

| Funktion | Anbieter und Modell einstellen unter | Cloud möglich |
|---|---|---|
| Korrespondenten, Tags, Dokumenttypen aufräumen und Tag-Wizard | Einstellungen → LLM Provider → Anbieter aufklappen → „Bereinigung-Modell" → „Speichern" → „Aktivieren". Es gilt der Anbieter mit der Marke „Aktiv". | ja |
| KI-Klassifizierer, manuell und automatisch | Anbieter: Einstellungen → Job-Zuweisung → „Dokument-Klassifizierer". Modell: beim Anbieter unter „Klassifizierer-Modell". | ja |
| OCR | OCR → Tab „Einstellungen" → „OCR Modell" | nur Mistral OCR |
| Dokumenten-Chat | Dokumenten-Chat → Zahnrad oben rechts → „Embedding-Modell" und „Chat-Modell" | nein, Ollama |
| Duplikate „Ähnliche Dokumente" | nutzt den Index des Dokumenten-Chats | – |

### Ollama: die richtige Adresse

Vorbelegt ist überall `http://localhost:11434`. Im Container zeigt das auf den Container selbst, nicht auf deinen Rechner.

| Ollama läuft … | Adresse |
|---|---|
| auf demselben Rechner wie Docker | `http://host.docker.internal:11434` |
| auf einem anderen Rechner | `http://<IP-des-Rechners>:11434` |

Unter Linux und auf einem anderen Rechner muss Ollama Verbindungen aus dem Netz annehmen: `OLLAMA_HOST=0.0.0.0` setzen und Ollama neu starten. Probe aus dem Container:

```bash
docker compose exec backend curl -s http://host.docker.internal:11434/api/tags
```

Die Adresse steht an **drei Stellen**, und jede gilt nur für ihren Bereich:

1. **Einstellungen → LLM Provider → Ollama (Lokal) → „Ollama URL"**: Aufräumen, Tag-Wizard, Klassifizierer. Reihenfolge: Adresse eintragen → „Speichern" → „Installierte Modelle laden" → beide Modelle wählen → „Speichern" → „Aktivieren".
2. **OCR → Tab „Einstellungen" → „Ollama Server URLs"**: OCR. Mit der Maus über den Eintrag fahren, „Edit", ändern, „Save", dann „Verbindung testen". Diese Adresse steuert auch die Anzeige „Ollama Online / Offline" oben links.
3. **Dokumenten-Chat**: hat dafür noch kein Eingabefeld. Einmal vor dem ersten Indexieren setzen:

   ```bash
   curl -X PUT http://<dein-server>:3001/api/rag/config \
     -H "Content-Type: application/json" \
     -d '{"ollama_base_url":"http://host.docker.internal:11434"}'
   ```

   `http://<dein-server>:3001/api/rag/health` muss danach bei `embedding` den Wert `healthy: true` zeigen.

Modelle, mit denen das Projekt getestet ist:

```bash
ollama pull qwen3.5:4b            # Klassifizierer und Chat
ollama pull qwen3.5:9b            # Aufräumen ("Bereinigung-Modell"), findet mehr Schreibweisen
ollama pull qwen3-vl:4b-instruct  # OCR
ollama pull mxbai-embed-large     # Suche im Dokumenten-Chat
```

### Nur Cloud

Einstellungen → LLM Provider → Anbieter aufklappen → „API Key" eintragen → „Speichern" → „Aktivieren". Dann unter Job-Zuweisung bei „Dokument-Klassifizierer" denselben Anbieter wählen. Der Klassifizierer schickt den Text des Dokuments an diesen Anbieter, das Aufräumen nur die Namen von Korrespondenten, Tags und Typen.

## 5. Ein sinnvoller erster Durchlauf

1. **Aufräumen → 1. Korrespondenten → „Mit KI analysieren".** Du bekommst Gruppen ähnlicher Namen und bestätigst jede Zusammenführung selbst. Danach Dokumententypen, dann Tags.
2. **KI-Klassifizierer:** ein paar Dokumente von Hand analysieren, Ergebnis ansehen, anwenden. Erst wenn die Vorschläge passen, die Auto-Klassifizierung einschalten.
3. **OCR:** ein schlecht erkanntes Dokument im Tab „Einzel-OCR" neu einlesen und alt gegen neu vergleichen.
4. **Dokumenten-Chat:** „Dokumente jetzt indexieren". Beim ersten Chat lädt das Backend einmalig ein Sortier-Modell von Hugging Face (einige hundert MB).

## 6. Stolpersteine

- **Auto-Klassifizierung schreibt direkt.** Vollständige Ergebnisse gehen sofort nach Paperless, auch im Modus „Immer prüfen". In die Prüfliste kommen nur unvollständige Ergebnisse.
- **„Ollama Offline", obwohl der Klassifizierer läuft:** Die Anzeige prüft nur die Adresse aus dem OCR-Tab.
- **„Installierte Modelle laden" zeigt nichts:** erst „Speichern", dann laden. Der Button nimmt die gespeicherte Adresse.
- **Status oben links ändert sich nicht:** Seite neu laden.
- **Zusammenführen und Löschen lassen sich nicht zurücknehmen.** Deshalb das Backup.

## 7. Sicherheit, Backup, Update

- **Nur im Heimnetz oder über VPN betreiben.** Die API hat keine Anmeldung. Der „Passwort-Schutz" in den Einstellungen sperrt nur die Oberfläche im Browser.
- **Backup:** Backend stoppen und den Ordner `data` kopieren. Darin liegen auch dein Paperless-Token und die API-Keys im Klartext.
- **Update:** `docker compose pull`, dann `docker compose up -d`. Vorher den Ordner `data` sichern.

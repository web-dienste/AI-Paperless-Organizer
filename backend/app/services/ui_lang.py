"""Sprache der Oberfläche.

Die Sprache wird in den App-Einstellungen gespeichert (Standard: Deutsch).
Das Frontend schickt die Sprache, in der es gerade anzeigt, als Kopfzeile X-UI-Lang mit.
Ohne Kopfzeile (z. B. Watchdog, Autostart nach Neustart) gilt die gespeicherte Sprache.
"""
from contextvars import ContextVar
from typing import Optional

SUPPORTED_LANGS = ("de", "en")

ui_lang: ContextVar[Optional[str]] = ContextVar("ui_lang", default=None)

_saved_lang = "de"


def set_saved_lang(value: Optional[str]) -> None:
    """Gespeicherte Sprache übernehmen (beim Start und nach dem Speichern)."""
    global _saved_lang
    _saved_lang = value if value in SUPPORTED_LANGS else "de"

# An Aufräum-Prompts angehängt, damit Begründungen auf Englisch kommen. Namen bleiben unverändert.
EN_REASONING_HINT = (
    "\n\nIMPORTANT: Write every explanation text (fields such as \"reasoning\" or \"reason\") in English. "
    "Keep all names exactly as they appear in the list."
)

# An Klassifizierer-Prompts angehängt: Begründungen englisch, Titel in der Sprache des Dokuments.
EN_CLASSIFIER_HINT = (
    "\n\nIMPORTANT: Write every explanation or reason text in English. "
    "Keep the document title in the language of the document. "
    "Keep existing tag, correspondent, document type and storage path names exactly as listed."
)

# An den Chat-System-Prompt angehängt.
EN_CHAT_HINT = "\n\nAnswer in English, unless the user's question is written in another language."


def is_en() -> bool:
    return (ui_lang.get() or _saved_lang) == "en"


def ui_text(de: str, en: str) -> str:
    """Gibt den Text in der Sprache der aktuellen Anfrage zurück."""
    return en if is_en() else de

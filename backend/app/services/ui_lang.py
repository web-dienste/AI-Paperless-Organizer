"""Sprache der Oberfläche für die laufende Anfrage.

Das Frontend schickt die Kopfzeile X-UI-Lang: en nur im (noch internen) englischen Modus.
Ohne Kopfzeile bleibt alles wie bisher deutsch.
"""
from contextvars import ContextVar

ui_lang: ContextVar[str] = ContextVar("ui_lang", default="de")

# An Aufräum-Prompts angehängt, damit Begründungen auf Englisch kommen. Namen bleiben unverändert.
EN_REASONING_HINT = (
    "\n\nIMPORTANT: Write every explanation text (fields such as \"reasoning\" or \"reason\") in English. "
    "Keep all names exactly as they appear in the list."
)


def is_en() -> bool:
    return ui_lang.get() == "en"


def ui_text(de: str, en: str) -> str:
    """Gibt den Text in der Sprache der aktuellen Anfrage zurück."""
    return en if is_en() else de

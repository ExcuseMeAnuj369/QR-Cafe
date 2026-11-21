from datetime import datetime, timezone

def today_iso(tz=None) -> str:
    """Anchor today server-side with ISO format in UTC."""
    return datetime.now(timezone.utc).isoformat()

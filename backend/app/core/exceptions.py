class NotFoundError(Exception):
    """Raised when a requested database record does not exist."""


class IngestionError(Exception):
    """Raised when ingestion cannot continue."""

"""Application-level errors mapped to HTTP responses via handlers in `main`."""


class AppError(Exception):
    """Base error carrying an HTTP status and a safe client-facing message."""

    def __init__(self, message: str, *, status_code: int = 500) -> None:
        self.message = message
        self.status_code = status_code
        super().__init__(message)

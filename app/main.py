"""
FastAPI application entry.

Uvicorn: `uvicorn app.main:app --reload` from repo root.
"""

from __future__ import annotations

from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

import httpx
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.core.config import settings
from app.core.exceptions import AppError
from app.core.logging import setup_logging
from app.routers import health, meditation


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    """
    Async lifespan: shared httpx client for LLM/TTS HTTP calls; extend for pools later.
    """
    setup_logging(settings.DEBUG)
    read_timeout = max(settings.LLM_TIMEOUT_SECONDS, settings.TTS_TIMEOUT_SECONDS)
    timeout = httpx.Timeout(connect=10.0, read=read_timeout, write=30.0, pool=5.0)
    app.state.http_client = httpx.AsyncClient(timeout=timeout)
    yield
    await app.state.http_client.aclose()


async def app_error_handler(_request: Request, exc: AppError) -> JSONResponse:
    return JSONResponse(status_code=exc.status_code, content={"detail": exc.message})


def create_app() -> FastAPI:
    application = FastAPI(
        title=settings.PROJECT_NAME,
        debug=settings.DEBUG,
        lifespan=lifespan,
    )
    application.add_exception_handler(AppError, app_error_handler)
    application.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origin_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    application.include_router(health.router, prefix=settings.API_V1_STR)
    application.include_router(meditation.router, prefix=settings.API_V1_STR)
    return application


app = create_app()

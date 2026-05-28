FROM python:3.12-slim

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV UV_PROJECT_ENVIRONMENT=/usr/local

RUN groupadd --system --gid 10001 app \
    && useradd --system --uid 10001 --gid app --create-home --home-dir /home/app app

COPY --chown=root:root --chmod=755 pyproject.toml uv.lock ./
RUN pip install --no-cache-dir --upgrade pip \
    && pip install --no-cache-dir uv==0.5.24 \
    && uv sync --locked --extra dev --no-install-project

COPY --chown=root:root --chmod=755 app ./app

USER app

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]

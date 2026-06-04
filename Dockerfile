FROM node:22-slim AS builder

WORKDIR /app

RUN npm install -g pnpm

COPY source/package.json source/pnpm-lock.yaml ./
RUN pnpm install

COPY source/ .
RUN pnpm run build

FROM node:22-slim AS runner

WORKDIR /app

RUN npm install -g pnpm

ARG GIT_COMMIT
ARG GIT_REPO

ENV GIT_COMMIT=$GIT_COMMIT
ENV GIT_REPO=$GIT_REPO

RUN printf '#!/bin/sh\n\
if [ "$1" = "rev-parse" ] && [ "$2" = "HEAD" ]; then\n\
  echo "${GIT_COMMIT:-dev-build}"\n\
elif [ "$1" = "remote" ] && [ "$2" = "get-url" ]; then\n\
  echo "${GIT_REPO:-https://github.com/unknown/repo}"\n\
else\n\
  echo "git: unsupported command $@" >&2\n\
  exit 1\n\
fi\n' > /usr/local/bin/git \
&& chmod +x /usr/local/bin/git

COPY --from=builder /app ./

COPY .env .env

ENTRYPOINT ["pnpm", "start"]
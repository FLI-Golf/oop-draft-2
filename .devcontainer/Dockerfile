FROM mcr.microsoft.com/devcontainers/base:ubuntu-24.04

# Install Go and Node.js
RUN apt-get update && export DEBIAN_FRONTEND=noninteractive \
    && apt-get -y install --no-install-recommends golang-go nodejs npm \
    && npm install -g pnpm

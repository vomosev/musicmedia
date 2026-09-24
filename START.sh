#!/usr/bin/env bash

set -Eeuo pipefail

PROJECT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
LOG_DIR="${PROJECT_DIR}/logs"
LOG_FILE="${LOG_DIR}/server.log"
PID_FILE="${LOG_DIR}/server.pid"

cd "${PROJECT_DIR}"
mkdir -p "${LOG_DIR}"

if [[ -f "${PID_FILE}" ]]; then
  existing_pid="$(cat "${PID_FILE}")"
  if [[ "${existing_pid}" =~ ^[0-9]+$ ]] && kill -0 "${existing_pid}" 2>/dev/null; then
    printf 'MusicMedia API is already running with PID %s.\n' "${existing_pid}"
    exit 0
  fi
  rm -f "${PID_FILE}"
fi

command -v npm >/dev/null 2>&1 || {
  printf 'Error: npm is not installed or is not available in PATH.\n' >&2
  exit 1
}

nohup npm run server </dev/null >>"${LOG_FILE}" 2>&1 &
server_pid=$!

printf '%s\n' "${server_pid}" >"${PID_FILE}"

sleep 1

if ! kill -0 "${server_pid}" 2>/dev/null; then
  wait "${server_pid}" || true
  rm -f "${PID_FILE}"
  printf 'Error: MusicMedia API failed to start. Check %s for details.\n' "${LOG_FILE}" >&2
  exit 1
fi

printf 'MusicMedia HTTPS API started with PID %s. Output: %s\n' "${server_pid}" "${LOG_FILE}"
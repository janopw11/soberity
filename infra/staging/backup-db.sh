#!/bin/sh
# Run only on the staging host. No deletion or retention pruning is automatic.
set -eu
umask 077
script_dir=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
env_file=${STAGING_ENV_FILE:-"$script_dir/.env"}
backup_dir=${1:-"$script_dir/.backups"}
test -f "$env_file" || { echo 'Missing staging env file.' >&2; exit 1; }
mkdir -p "$backup_dir"
backup_file=$(mktemp "$backup_dir/staging-$(date -u +%Y%m%dT%H%M%SZ)-XXXXXX")
trap 'rm -f "$backup_file"' EXIT HUP INT TERM
docker compose --project-name soberity-staging --env-file "$env_file" \
  -f "$script_dir/compose.yml" exec -T postgres \
  pg_dump -U soberity -d soberity --format=custom > "$backup_file"
test -s "$backup_file"
mv "$backup_file" "$backup_file.dump"
trap - EXIT HUP INT TERM
echo "Backup written: $backup_file.dump"

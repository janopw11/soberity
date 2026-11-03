#!/bin/sh
# Restore a trusted staging dump into a NEW isolated database; never overwrite.
set -eu
script_dir=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
env_file=${STAGING_ENV_FILE:-"$script_dir/.env"}
dump_file=${1:?Usage: restore-check.sh TRUSTED_DUMP restore_check_NAME}
target_db=${2:?Specify a NEW database named restore_check_NAME}
case "$target_db" in
  restore_check_*) ;;
  *) echo 'Refusing to restore outside a restore_check_ database.' >&2; exit 1 ;;
esac
case "$target_db" in
  *[!a-z0-9_]*) echo 'Use only lowercase letters, digits and underscores.' >&2; exit 1 ;;
esac
test -f "$dump_file"
test -f "$env_file"
compose() {
  docker compose --project-name soberity-staging --env-file "$env_file" \
    -f "$script_dir/compose.yml" "$@"
}
# createdb fails if the target exists, protecting previous restores.
compose exec -T postgres createdb -U soberity "$target_db"
compose exec -T postgres pg_restore -U soberity -d "$target_db" \
  --no-owner --no-acl --exit-on-error < "$dump_file"
compose exec -T postgres psql -U soberity -d "$target_db" --set ON_ERROR_STOP=1 \
  -c 'SELECT count(*) AS migrations FROM flyway_schema_history WHERE success;'
echo "Restore check completed in $target_db; no databases were dropped."

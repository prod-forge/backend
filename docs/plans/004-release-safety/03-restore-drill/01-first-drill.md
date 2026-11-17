**Status:** 📝 draft · **Version:** — (docs only) · **Date:** 2026-11-17 · **Modules:** terraform guide (backup-and-dr.md)

# 01 — First restore drill

## Procedure (owner, AWS)

The "Quarterly restore drill" checklist of `terraform/guide/backup-and-dr.md`, with the backend checks on the restored
copy:

1. Point-in-time restore and snapshot restore into throwaway identifiers; time from the call to `available`.
2. Row counts and newest records against the source, through the VPN.
3. `prisma migrate status` against the restored copy: every migration applied, none failed.
4. One-off app task pointed at the restored instance, `load/k6-smoke.js` with one VU through it.
5. Delete the drill instances; confirm no orphan snapshots.

## Files (terraform repo)

- `guide/backup-and-dr.md` — "dry-run mode" replaced by `prisma migrate status`; a "Drill log" table (date,
  environment, restore type, time to `available`, checks, issues) with the first run; the RTO estimate replaced by the
  measured value.

## Tests

The drill log entry is the proof. Anything that did not work as written becomes a fix of the guide in the same change
or an entry in `terraform/docs/open-issues/`.

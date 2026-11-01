---
name: release
description: Refresh the committed Stammbaum/ folder (Stammbaum.html + guides in German, English and French + licences + example project) that people download from the repo or receive zipped by email. Use when the user wants a version to share/test, or before tagging a release.
---

# Release

The `Stammbaum/` folder at the repo root is what people get: they use it live on GitHub Pages, download
`Stammbaum.html` from GitHub, or the user zips the folder and emails it (ADR-0002). It only changes on a release, so it always holds a tested version.
`dist/` is the git-ignored build output that every build and test run writes.

## Steps

1. `npm run verify` must be green.
2. Bump `version` in `package.json` if this is a release for others (semver: fix → patch, feature → minor).
   The version is shown in the app (`APP_VERSION`).
3. `npm run release` rebuilds and rewrites `Stammbaum/`:
   - `Stammbaum.html`, the whole app
   - `Anleitung.txt`, `Guide.txt` and `Mode-d-emploi.txt`, generated from `docs/user-guide/Anleitung.md`,
     `Guide.md` and `Mode-d-emploi.md` (UTF-8 with BOM, CRLF; `.gitattributes` keeps the CRLF)
   - `LICENSES.txt`, our MIT `LICENSE` plus the licences of the bundled libraries (`dist/licenses.md`,
     collected by Vite's `build.license`, GEN-08)
   - `Beispiel.stammbaum`, the example family, built from `examples/familie-brandt.json`
4. **Check the result:**
   - `npm run test:unit`: `tests/unit/release-folder.test.ts` checks the files, the version and the example.
   - Open `Stammbaum/Stammbaum.html` in Playwright (or ask the user to double-click it) and open `Beispiel.stammbaum`.
   - The folder must stay small enough for email (warn the user if it is > 10 MB).
5. Make sure **no real family data** went into the folder: only files from `examples/` and `docs/user-guide/`.
6. Commit `chore(release): v<version>` (the folder and the version bump together), tag `v<version>`, push.
   Ask the user before pushing tags. The push also updates the live app on GitHub Pages (GEN-09): check that the
   "Pages" workflow is green (`gh run list --workflow pages.yml -L 1`) and that https://bimo3000.github.io/family-tree/
   shows the new version.
7. Tell the user what to check manually (`docs/manual-checks.md`, ideally a real Windows and macOS/Safari machine).

## Notes

- Script: `scripts/release-folder.mjs`. The `.stammbaum` writer is `scripts/lib/zip.mjs` (unit-tested). It uses a fixed
  timestamp, so `Beispiel.stammbaum` only changes when the example family does.
- Don't run `npm run release` between releases: the folder would then hold an unreleased state.

---
name: release-package
description: Build and check the distributable Stammbaum zip (Stammbaum.html + Anleitung.txt + example project) that end users receive by email. Use when the user wants a version to share/test, or before tagging a release.
---

# Release package

## Steps

1. `npm run verify` must be green.
2. Bump `version` in `package.json` if this is a release for others (semver: fix → patch, feature → minor).
   The version is shown in the app (`APP_VERSION`) and is part of the zip name.
3. `npm run package` → `release/Stammbaum-<version>.zip`. It contains:
   - `Stammbaum/Stammbaum.html`, the whole app
   - `Stammbaum/Anleitung.txt`, generated from `docs/user-guide/Anleitung.md` (UTF-8 with BOM, CRLF)
   - `Stammbaum/*.stammbaum`, the example projects from `examples/`
4. **Check the result:**
   - `python3 -c "import zipfile,sys; z=zipfile.ZipFile(sys.argv[1]); print(z.testzip(), z.namelist())" release/Stammbaum-<version>.zip`
     must print `None` and the expected files.
   - Unzip into the session scratchpad and open `Stammbaum.html` from there in Playwright, or ask the user to double-click it.
   - The size must stay reasonable for email (warn the user if it is > 10 MB).
5. Make sure **no real family data** went into the zip: only files from `examples/` and `docs/user-guide/`.
6. Tell the user where the zip is and what to check manually (ideally a real Windows and macOS/Safari machine).
7. If `version` was bumped: commit `chore(release): v<version>`, tag `v<version>`, push.
   Ask the user before pushing tags.

## Notes

- Packaging script: `scripts/package-release.mjs`. Zip writer: `scripts/lib/zip.mjs` (unit-tested).
- `release/` is git-ignored. Never commit zips.

# ADR-0005: Storage – `.stammbaum` zip file plus browser working copy

- **Status:** Accepted (format aligned with the user on 2026-10-24; adapter details are part of the concept)
- **Date:** 2026-10-24
- **Requirements:** DATA-02, DATA-03, DATA-04, DATA-05, GEN-02, PRIV-02

## Context

A browser page cannot freely read and write files. Chrome/Edge offer the File System Access API to write
into a user-chosen file. Firefox and Safari can only open files and download new ones. Users must be able to email
and back up their tree, and the last project should reopen by itself.

## Decision

- **One project = one file** `Name.stammbaum`: a zip with `data.json` and `bilder/*.jpg`. Zip handling via **fflate**
  (MIT, no dependencies, bundled), pinned exact at `0.8.3` and added in S5 (`src/storage/projectFile.ts`).
- **Working copy** in IndexedDB (data and pictures as blobs), autosaved after every change, plus a pointer to the last project.
- **Storage adapters** behind one interface:
  - `FileSystemAccessAdapter` (Chromium): open/save in place. The file handle is stored in IndexedDB so the file can be re-used after a restart (needs a permission click).
  - `DownloadAdapter` (Firefox/Safari): open via `<input type=file>`, save via a download of a `blob:` URL.
  - The adapter is chosen by feature detection, never by browser name.
- **Spike (2026-10-24, Playwright/Linux):** under `file://`, IndexedDB with blobs works in Chromium, Firefox and WebKit,
  survives a browser restart, and survives moving or renaming `Stammbaum.html`. File System Access exists only in Chromium.

## Consequences

- In Firefox/Safari every save is a new download, so the UI must explain this and show the save status.
- All `file://` pages of a browser share storage. Another local HTML page could read the working copy (low risk, documented).
- A real Safari on macOS needs a manual check.
- Picker dialogs can't be automated in E2E tests. Adapters get fakes in tests, plus a manual checklist.

## Alternatives considered

- **Folder with data.json + bilder/**: only writable in Chromium, and awkward to email (rejected by the user).
- **Browser storage only + export**: data is lost when the browser data is cleared (rejected by the user).
- **JSON with base64 images**: one file too, but ~33 % bigger and slow to parse with many pictures.

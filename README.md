# Stammbaum – offline family-tree app

A private, self-contained web app to **create, edit and view family trees**.

- Runs **fully offline** in a normal desktop browser (Chrome, Edge, Firefox, Safari) on Windows, Linux and macOS.
- Ships as a **zip you can email**: unzip, double-click `Stammbaum.html`, done. No installation.
- **No data ever leaves the device.** The family data stays in local project files (`*.stammbaum`).
- App language: **German**.

> Status: development setup and concept phase. No functional features yet.
> The current state is always in [docs/agent/HANDOVER.md](docs/agent/HANDOVER.md).

## Where to find what

| You want to … | Go to |
|---|---|
| See what the app must do (the contract) | [docs/requirements/REQUIREMENTS.md](docs/requirements/REQUIREMENTS.md) |
| Understand how it is built | [docs/concept/](docs/concept/) |
| Know why a technical choice was made | [docs/agent/decisions/](docs/agent/decisions/) |
| See the current status / next steps | [docs/agent/HANDOVER.md](docs/agent/HANDOVER.md) |
| Read all docs in one overview | [docs/README.md](docs/README.md) |

## Developer quick start

The tooling is needed **only for development**. End users only need the built HTML file.

Prerequisite: Node.js (version in `.nvmrc`, installed via [nvm](https://github.com/nvm-sh/nvm)).

```bash
nvm use            # select the pinned Node version
npm install        # install dev tools + activate the git pre-push hook
npm run dev        # live-reloading dev server for development
npm run verify     # everything the pre-push hook checks (types, lint, tests, build)
npm run package    # build the distributable zip into release/
```

See [docs/README.md](docs/README.md) for the full list of commands.

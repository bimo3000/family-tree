# Examples

Fictional example data only. **Never put real family data here.** This folder is committed to git.

- `familie-brandt.json` – the fictional "Familie Brandt" (ported from the mock-up), in the format of `data.json`
  inside a project file. The app embeds it for "Beispiel ansehen" (`src/ui/example.ts`), and the unit tests use it
  as their main fixture (`tests/fixtures/familie-brandt.ts`). It covers four generations, remarriage (Karl), divorce
  (Peter and Sabine), adoption (Jonas), an unknown parent (Michael and Stefan), a couple without a kind (Thomas and
  Julia) and a person without gender (Kim). Any resemblance to real persons is coincidental.
- `Beispiel.stammbaum` (not in git): the same family as a project file. `npm run package` builds it from
  `familie-brandt.json` and puts it into the release zip, so the two never differ (tested in
  `tests/unit/storage/projectFile.test.ts`).

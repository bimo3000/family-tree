# Manual checks (real Mac and Windows)

The automated tests run the app in Chromium, Firefox and WebKit on Linux. A few things only a person on a real machine
can check: the real file picker, the browser's permission question, Safari itself, and whether the app is easy to use
(GEN-02, DATA-09, GEN-06). Do this list once per release zip, on **Windows (Edge or Chrome)** and on a **Mac (Safari)**.
Firefox on either one is a bonus.

Note the date, machine, browser and version, and anything odd (a screenshot helps). Then tell the agent in the next
session; it updates the requirement statuses.

## Checklist

| #   | Do this                                                                                                | Expected                                                                                    |
| --- | ------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------- |
| 1   | Unzip `Stammbaum-<version>.zip`, double-click `Stammbaum.html`.                                        | The start screen opens in the browser. No warning, no internet needed (try with Wi-Fi off). |
| 2   | "Beispiel ansehen". Drag the tree, zoom with the wheel, double-click a person, click a person.         | Smooth, the panel opens. The hint bar at the top goes away after the first click.           |
| 3   | Menu (name at the top left) → "Hilfe".                                                                 | The help dialog opens at the top; "Schließen" and Esc close it.                             |
| 4   | Menu → "Neuer Stammbaum", enter a name, add a person, a partner, a child, a parent.                    | Every step works without explanation (grandma test, GEN-06). Undo ↶ and redo ↷ work.        |
| 5   | Add a photo (a normal JPG, and if you have one, an iPhone HEIC).                                       | The JPG shows on the card. HEIC: either it works, or the message asks to save it as JPG.    |
| 6   | Reload the page (F5 / Cmd+R), then close and reopen the browser and `Stammbaum.html`.                  | The tree is still there.                                                                    |
| 7   | **Edge/Chrome:** "Speichern".                                                                          | A real "Speichern unter" window; the file is created. The status shows "✓ Gespeichert".     |
| 8   | **Edge/Chrome:** change a name, wait 3 seconds, then open the saved file in a second tab ("Öffnen …"). | The change is in the file (written by itself, DATA-09).                                     |
| 9   | **Edge/Chrome:** restart the browser, open `Stammbaum.html`, change something, click "Speichern".      | The browser asks once whether the app may edit the file. After "Erlauben" it saves.         |
| 10  | **Safari/Firefox:** "Speichern".                                                                       | The file lands in Downloads; the first time a hint says so.                                 |
| 11  | Menu → "Drucken / Als PDF speichern", choose "Als PDF speichern" (Mac: "PDF" → "Als PDF sichern").     | One A4 landscape page with the name on top and the whole tree; no buttons, no panel.        |
| 12  | Open `Beispiel.stammbaum` from the unzipped folder ("Öffnen …" or drag it onto the window).            | The example family opens. If the open tree had unsaved changes, the app asks first.         |
| 13  | Open a saved file on the other machine (send it by email or USB stick).                                | Everything, including photos, is there.                                                     |

## Results

| Date | Machine / OS | Browser + version | Result (all ok, or the numbers that failed) |
| ---- | ------------ | ----------------- | ------------------------------------------- |
| –    | –            | –                 | not done yet                                |

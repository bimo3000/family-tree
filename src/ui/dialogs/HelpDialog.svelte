<script lang="ts">
  import Modal from './Modal.svelte';

  interface Props {
    onclose: () => void;
  }
  let { onclose }: Props = $props();
</script>

<!-- ui-concept §7: a short help inside the app, no internet needed. -->
<Modal label="Hilfe" wide {onclose}>
  <h2>Hilfe</h2>
  <p class="muted">Dein Stammbaum bleibt auf deinem Computer. Es wird nichts verschickt.</p>

  <h3>Personen hinzufügen</h3>
  <p>
    Klick auf eine Person. Rechts erscheinen ihre Angaben. Mit „+&nbsp;Elternteil“,
    „+&nbsp;Partner/in“, „+&nbsp;Kind“ und „+&nbsp;Geschwister“ fügst du Verwandte hinzu, mit
    „Bearbeiten“ änderst du Namen, Daten und Foto. Alle Angaben sind freiwillig. Ungenaue Daten
    gehen auch, zum Beispiel „ca. 1850“ oder „vor 1900“.
  </p>

  <h3>Baum bewegen und zoomen</h3>
  <p>
    Zieh mit der Maus, um den Baum zu verschieben. Mit dem Mausrad oder mit + und − zoomst du.
    „Alles anzeigen“ zeigt den ganzen Baum. Ein Doppelklick auf eine Person holt sie in die Mitte.
  </p>

  <h3>Beziehungen ändern</h3>
  <p>
    In den Angaben einer Person steht bei Eltern, Partnern und Kindern ein ✎ zum Ändern (zum
    Beispiel Ehe, Scheidung, Adoptivkind) und ein × zum Entfernen der Verbindung. Jede Änderung
    machst du mit ↶ oder Strg+Z rückgängig.
  </p>

  <h3>Speichern und Sichern</h3>
  <p>
    Deine Änderungen bleiben im Browser erhalten, auch wenn du ihn schließt. Richtig sicher ist dein
    Stammbaum aber erst in einer Datei: Klick auf „Speichern“. In Chrome und Edge wählst du einmal
    einen Ort, danach kommt jede Änderung von selbst in die Datei. In Firefox und Safari landet die
    Datei im Download-Ordner. Klick nach Änderungen einfach wieder auf „Speichern“. Kopier die Datei
    ab und zu auf einen USB-Stick.
  </p>

  <h3>Drucken</h3>
  <p>
    Klick oben links auf den Namen deines Stammbaums und dann auf „Drucken / Als PDF speichern“. Der
    ganze Baum kommt auf eine Seite im Querformat. Für eine PDF-Datei wählst du im Druckfenster als
    Drucker „Als PDF speichern“ (auf dem Mac unten „PDF“, dann „Als PDF sichern“).
  </p>

  <div class="form-actions">
    <button type="button" class="btn primary" onclick={onclose}>Schließen</button>
  </div>
</Modal>

<style>
  p {
    line-height: 1.5;
    margin: 0.4em 0;
  }
</style>

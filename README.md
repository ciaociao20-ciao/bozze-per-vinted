# Bozze per Vinted

App gratuita e open source per preparare dal telefono le bozze degli annunci Vinted, con lo stesso modulo di Vinted e le **foto originali salvate nella memoria del telefono**. Quando le bozze sono pronte le esporti in pacchetti ZIP e **Claude** le carica su Vinted per te, come bozze.

Funziona su **iPhone** e **Android** (e su computer), anche senza internet. Non serve nessun account per usarla: non c'è un server, i dati non lasciano il telefono finché non li esporti tu.

> Progetto indipendente, **non affiliato a Vinted**.

## Cosa fa

Il modulo ha gli stessi campi e limiti di Vinted: fino a 20 foto (la prima è la copertina, puoi riordinarle), titolo fino a 100 caratteri, descrizione fino a 3000, categoria Donna e Uomo con ricerca, brand, taglia adatta alla categoria (lettere, W per i jeans, EU per le scarpe…), condizioni, fino a 2 colori, fino a 3 materiali, prezzo (minimo 1 €), dimensioni del pacco e Unisex.

Ogni bozza si salva da sola mentre scrivi. Le foto vengono conservate **byte per byte come le hai scattate**: niente compressione. Per scorrere velocemente l'app crea a parte una piccola miniatura.

Sotto titolo e descrizione ci sono i **tag**. *Tag nel titolo* propone le parole di stile più cercate per quel capo (Vinted cerca nel titolo: brand + capo + 2-3 tag di stile) e le aggiunge o toglie con un tocco. *Hashtag* gestisce il blocco di hashtag in fondo alla descrizione: blocchi pronti per tipo di capo (jeans, tute, Polo Ralph Lauren, pelle, Japan Style, outdoor, maglie da calcio, flanelle, Y2K donna, universali), oltre 450 tag divisi per estetica, epoca, capo e rarità, ricerca, tag scritti da te e blocchi personali salvati. L'app avvisa se compare il nome di un brand diverso da quello del capo, che è la cosa che più facilmente fa rimuovere un annuncio, e se gli hashtag superano i 40. I tag stanno in `tags.js` e vengono dalla raccolta *Tag più usati dai reseller su Vinted* (ottobre 2026).

Nelle impostazioni puoi decidere i valori con cui parte ogni nuova bozza (condizioni, pacco, brand per gli articoli senza marca, un modello di descrizione con la referenza `{ref}`).

## Installazione

L'app è un sito web installabile (PWA). Una volta pubblicata, apri il suo indirizzo e:

**iPhone (Safari):** tocca Condividi (il quadrato con la freccia) → *Aggiungi alla schermata Home* → *Aggiungi*. Da quel momento apri sempre l'icona sulla Home: per iOS le bozze salvate nell'app e quelle salvate in Safari sono in due memorie separate.

**Android (Chrome):** menu ⋮ → *Installa app* (o *Aggiungi a schermata Home*).

Al primo salvataggio l'app chiede al sistema di proteggere la memoria dalla pulizia automatica. Quanto spazio puoi usare lo decide il telefono: in genere una buona parte dello spazio libero. Lo vedi in Impostazioni.

## Spazio: un esempio

Una foto da iPhone pesa circa 2–4 MB. 300 articoli con 15 foto l'uno fanno 10–15 GB: sul telefono deve esserci almeno altrettanto spazio libero. Esportando ed eliminando le bozze già caricate su Vinted liberi spazio.

## Inviare le bozze a Claude con un tasto (Google Drive)

Dalla versione 1.2 l'app può caricare da sola le bozze nel tuo Google Drive: tocca **Invia a Claude** (icona in alto) → **Invia tutto**. Ogni bozza pronta diventa una cartella `Bozze Vinted/<referenza>_<titolo>/` con le foto originali (`foto-01.jpg`…), `scheda.json` e `scheda.txt`. Il caricamento mostra l'avanzamento, tiene lo schermo acceso e, se si interrompe, riparte da dove era; le bozze modificate dopo l'invio vengono rimandate (solo la scheda, se le foto non sono cambiate). Nessun server in mezzo: il telefono parla direttamente con Google.

Serve una **chiave Google (OAuth Client ID)**, gratuita, da creare una volta nel proprio account Google:

1. Vai su [console.cloud.google.com](https://console.cloud.google.com), crea un progetto (es. «Bozze Vinted»).
2. *API e servizi → Libreria*: attiva **Google Drive API**.
3. *Schermata consenso OAuth* (Google Auth Platform): tipo **Esterno**, nome app «Bozze per Vinted», la tua email come contatto; ambito `https://www.googleapis.com/auth/drive.file` (l'app vede solo i file che crea lei); pubblica l'app (con questo ambito non serve la verifica di Google).
4. *Credenziali → Crea credenziali → ID client OAuth*, tipo **Applicazione web**. Origine JavaScript autorizzata: l'indirizzo del sito (es. `https://tuo-utente.github.io`); URI di reindirizzamento autorizzato: l'indirizzo completo dell'app con la barra finale (es. `https://tuo-utente.github.io/bozze-per-vinted/`). L'app lo mostra in Impostazioni → Google Drive, con un tasto Copia.
5. Copia il **Client ID** e incollalo nell'app in Impostazioni → Google Drive → Salva valori → Collega Google Drive.

Il permesso dura circa un'ora e l'app lo rinnova da sola. L'app non vede gli altri file del tuo Drive (ambito `drive.file`). Il token non viene salvato sul disco: resta nella sessione dell'app.

## Esportare come pacchetti ZIP (senza Google)

1. Tocca **Invia a Claude** in alto e apri *Altri modi: pacchetti ZIP*. Sono già selezionate le bozze *Pronte*.
2. Tocca **Prepara pacchetti**. L'app crea un file ZIP per ogni articolo e li raggruppa in invii da circa 200 MB.
3. Per ogni invio tocca **Condividi** e salva i file sempre nella stessa cartella: *Salva su File* (iCloud Drive), *Drive* (Google Drive), oppure AirDrop/cavo verso il computer. Dove la condivisione di file ZIP non è disponibile (per esempio su alcuni Android) c'è **Scarica**: i file vanno nella cartella Download.
4. Copia le **istruzioni per Claude** dalla stessa schermata, aprile in Claude (sul computer, con Claude in Chrome e Vinted già connesso) e indica dove hai salvato i pacchetti.

Ogni ZIP contiene:

```
scheda.json   tutti i campi in formato leggibile da un programma (formato bozze-vinted/1)
scheda.txt    gli stessi campi in chiaro
foto-01.jpg   la copertina
foto-02.jpg   … le altre foto, nell'ordine scelto, originali
```

I pacchetti sono anche il tuo **backup**: con *Importa pacchetti ZIP* li rimetti nell'app, sullo stesso telefono o su uno nuovo. Le bozze modificate dopo l'esportazione tornano tra le *Pronte* finché non le esporti di nuovo.

Le specifiche del formato e la procedura che Claude segue sono in [PER-CLAUDE.md](PER-CLAUDE.md).

## Pubblicare l'app (gratis) con GitHub Pages

1. Crea un repository su GitHub e carica tutti i file di questa cartella (anche la cartella `icons`).
2. In *Settings → Pages* scegli *Deploy from a branch*, ramo `main`, cartella `/ (root)`.
3. Dopo un minuto l'app è online all'indirizzo `https://<tuo-utente>.github.io/<nome-repository>/`.

Va bene qualsiasi hosting statico con HTTPS (Netlify, Cloudflare Pages, il tuo sito). Non serve nessuna configurazione lato server.

### Valori di partenza via link

Puoi preparare un link che imposta i valori di partenza al primo avvio: aggiungi all'indirizzo `#regole=` seguito dal JSON delle impostazioni codificato in base64url, per esempio:

```json
{"condition":"Ottime condizioni","parcel":"Piccola","noBrand":"Nessun brand","descTemplate":"Ref. {ref}\n\n"}
```

## Privacy

Nessun dato viene inviato da nessuna parte. Non ci sono analytics né cookie di terze parti. Le foto e le bozze stanno in IndexedDB nel browser del telefono; l'unico modo per farle uscire è l'esportazione che avvii tu. Attenzione: cancellando i dati del browser o rimuovendo l'app dalla Home le bozze vengono cancellate, quindi esporta spesso.

## Struttura del progetto

```
index.html            pagina dell'app
app.css               stile (tema chiaro e scuro)
app.js                logica: archivio locale, modulo, foto, esportazione, importazione
data.js               categorie, taglie, colori, materiali, condizioni, brand
tags.js               tag per titolo e descrizione, blocchi pronti
sw.js                 service worker per l'uso offline
manifest.webmanifest  dati per l'installazione
icons/                icone
PER-CLAUDE.md         formato dei pacchetti e procedura di caricamento
```

Nessuna dipendenza esterna e nessuna compilazione: si modifica e si pubblica così com'è. Se cambi `app.js` o gli altri file, aumenta la versione in `sw.js` (`CACHE`) così i telefoni scaricano l'aggiornamento.

## Licenza

MIT. Vedi [LICENSE](LICENSE).

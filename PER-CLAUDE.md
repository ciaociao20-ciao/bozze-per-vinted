# Pacchetti «Bozze per Vinted» — istruzioni per Claude

Questo file descrive il formato dei pacchetti esportati dall'app e come caricarli su Vinted come **bozze**. È pensato per Claude (Claude in Chrome sul computer dell'utente), ma vale per qualsiasi persona o programma.

## Formato `bozze-vinted/1`

Un file ZIP per articolo, senza compressione, chiamato `<REFERENZA>_<titolo-breve>.zip` (oppure `bozza-xxxxxx_<titolo>.zip` se manca la referenza). Contenuto:

| File | Contenuto |
|---|---|
| `scheda.json` | tutti i campi, vedi sotto |
| `scheda.txt` | gli stessi campi in chiaro |
| `foto-01.jpg` … `foto-20.jpg` | foto originali in ordine; `foto-01` è la copertina. L'estensione può essere `.png` o `.webp` |

Campi di `scheda.json`:

| Campo | Tipo | Note |
|---|---|---|
| `formato` | testo | `"bozze-vinted/1"` |
| `id` | testo | identificativo stabile della bozza |
| `referenza` | testo o null | codice interno, es. `#T120` |
| `titolo` | testo | max 100 caratteri |
| `descrizione` | testo | max 3000 caratteri |
| `categoria` | lista di testi | percorso completo come nel menu di Vinted, es. `["Uomo","Abbigliamento","Felpe e maglioni","Felpe con cappuccio"]` |
| `brand` | testo | come va scritto su Vinted |
| `taglia` | testo o null | null se la categoria non ha taglie |
| `condizioni` | testo | una di: Nuovo con cartellino, Nuovo senza cartellino, Ottime condizioni, Buone condizioni, Discrete condizioni |
| `colori` | lista | 1–2 colori, nomi del menu di Vinted |
| `materiali` | lista | 0–3; lista vuota = non compilare |
| `prezzo` | numero | euro, es. `24.9` |
| `pacco` | testo | Piccola, Media o Grande |
| `unisex` | sì/no | |
| `foto` | lista | nomi dei file foto, in ordine |
| `completa` / `mancano` | | se `completa` è falso, `mancano` elenca i campi vuoti |
| `stato` | testo | `bozza` oppure `caricata_su_vinted` |
| `creata`, `modificata`, `esportata` | data ISO | |

## Procedura di caricamento come bozza

Per ogni pacchetto, uno alla volta:

1. Estrai lo ZIP e leggi `scheda.json`. Salta i pacchetti con `stato: "caricata_su_vinted"`; segnala quelli con `completa: false`.
2. Apri `https://www.vinted.it/items/new` nel browser dell'utente, già connesso al suo account.
3. Carica le foto nell'ordine di `foto`, **senza ridimensionarle né modificarle** (pochi file per volta se lo strumento di caricamento ha un limite di dimensione).
4. Compila titolo e descrizione esattamente come nella scheda.
5. Scegli la categoria seguendo il percorso di `categoria` livello per livello. Se un livello ha un nome leggermente diverso su Vinted, scegli la voce equivalente e annotalo nel resoconto.
6. Compila brand, taglia, condizioni, colori, materiali (solo se presenti), prezzo e dimensioni del pacco.
7. Salva come **bozza**. Non pubblicare.
8. Aspetta circa 60 secondi prima dell'articolo successivo, per non sembrare un'automazione aggressiva.

Alla fine scrivi un resoconto: per ogni referenza, salvata come bozza oppure no e perché. L'utente può poi segnare gli articoli come *Su Vinted* nell'app.

## Dove si trovano i pacchetti

L'utente li salva in una cartella che Claude può raggiungere: una cartella del computer collegata alla sessione (app desktop di Claude), una cartella di Google Drive accessibile dal connettore Drive, oppure file allegati direttamente alla chat per pochi articoli.

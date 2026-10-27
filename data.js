// Dati del modulo Vinted (categorie Donna/Uomo, taglie, colori, materiali, condizioni, pacco)
// Generato per Bozze Vinted — modifica liberamente.
"use strict";
/* ---------- Dati come su Vinted ---------- */
const LIMITS = { photos: 20, title: 100, desc: 3000, colors: 2, materials: 3, priceMin: 1 };
const CONDITIONS = [
  ['Nuovo con cartellino', 'Un articolo nuovo di zecca, mai usato, con cartellino o confezione originale.'],
  ['Nuovo senza cartellino', 'Un articolo nuovo di zecca, mai usato, senza cartellino o confezione originale.'],
  ['Ottime condizioni', 'Un articolo usato pochissimo, che può avere piccole imperfezioni, ma che sembra nuovo.'],
  ['Buone condizioni', 'Un articolo usato che potrebbe avere imperfezioni o segni di usura.'],
  ['Discrete condizioni', 'Un articolo usato spesso, con imperfezioni o segni di usura visibili.']
];
const PARCELS = [
  ['Piccola', 'Per articoli che stanno in una busta grande (es. t-shirt, camicie, accessori).'],
  ['Media', 'Per articoli che stanno in una scatola da scarpe (es. scarpe, jeans, giacche leggere).'],
  ['Grande', 'Per articoli che stanno in una scatola da trasloco (es. cappotti, piumini, borse grandi).']
];
const COLORS = [
  ['Nero','#000000'],['Grigio','#919191'],['Bianco','#ffffff'],['Panna','#f8f8e1'],['Beige','#d9c3a1'],['Kaki','#8f8a5a'],
  ['Marrone','#7b4b2a'],['Bordeaux','#6e1d2e'],['Rosso','#d7262d'],['Rosa','#f4a6c4'],['Corallo','#f27a5e'],['Arancione','#f4832b'],
  ['Giallo','#f6d121'],['Senape','#d1a61d'],['Verde','#3a9d45'],['Verde scuro','#1e5634'],['Turchese','#39bfbf'],['Azzurro','#86bceb'],
  ['Blu','#1f5fc4'],['Blu scuro','#15265e'],['Viola','#6e3ba6'],['Lilla','#c9a3db'],['Oro','#d4af37'],['Argento','#bfc3c6'],
  ['Multicolore','multi'],['Menta','#9edfc0'],['Albicocca','#f9c9a6'],['Fucsia','#dd1f8a'],['Trasparente','clear']
];
const MATERIALS = ['Acrilico','Alpaca','Bambù','Cashmere','Chiffon','Cotone','Denim','Ecopelle','Elastan','Flanella','Gomma','Jersey','Lana','Lana merino','Lino','Lycra','Mohair','Neoprene','Nylon','Paglia','Pelle','Pelle scamosciata','Pelliccia','Pelliccia sintetica','Pile','Pizzo','Poliestere','Raso','Rete','Seta','Softshell','Spugna','Tela','Tulle','Tweed','Velluto','Velluto a coste','Viscosa','Altro'];
const BRANDS = ['Polo Ralph Lauren','Ralph Lauren','Lacoste','Tommy Hilfiger','Tommy Jeans',"Levi's",'Nike','Adidas','Adidas Originals','Carhartt','Carhartt WIP','Burberry','Stone Island','C.P. Company','The North Face','Champion','Fila','Kappa','Diadora','Lotto','Sergio Tacchini','Ellesse','Umbro','Reebok','Puma','Wrangler','Lee','Diesel','Emporio Armani','Giorgio Armani','Armani Jeans','Moncler','Barbour','Napapijri','Patagonia','Columbia','Dickies','Timberland','Dr. Martens','Converse','Vans','New Balance','Asics','Gap','United Colors of Benetton','Stüssy','Supreme','Guess','Calvin Klein','Hugo Boss','Zara','H&M','Japan Style','Harley-Davidson','Versace','Versace Jeans Couture','Dolce & Gabbana','Gucci','Prada','Fendi','Valentino','Max Mara','Trussardi','Iceberg','Best Company','Fiorucci','Energie','Replay','Gas','Pepe Jeans','Jack & Jones','Fred Perry','Ben Sherman','Lyle & Scott','Gant','Marlboro Classics','Woolrich','Schott','Alpha Industries','Helly Hansen','Invicta','Eastpak','Fjällräven','Nautica','Chaps','Lee Cooper','Mustang','Pierre Cardin','Yves Saint Laurent','Christian Dior','Chanel','Hermès','Louis Vuitton','Kenzo','Missoni','Sisley','Stefanel','Pull & Bear','Bershka','Stradivarius','Mango','Uniqlo','Desigual','Scotch & Soda','Superdry','Hollister','Abercrombie & Fitch','Jordan','Le Coq Sportif','Hummel','Mizuno','Saucony','Skechers','Geox','Clarks','Birkenstock','UGG','Camper','Hogan',"Tod's",'Golden Goose','Superga','Caterpillar','Red Wing','Blundstone','Moon Boot','Fay','Herno','Colmar','Peuterey','Blauer','Refrigiwear','K-Way','Belstaff','Canada Goose','Parajumpers','Save the Duck','Ciesse Piumini',"Henry Cotton's",'North Sails','Paul & Shark','Harmont & Blaine','Sun68','Australian','Robe di Kappa','Lonsdale','Everlast','Starter','Mitchell & Ness','Russell Athletic','Fruit of the Loom','Gildan','Hanes','Onitsuka Tiger','Karhu','Lotto Leggenda','Diadora Heritage','Sportswear','Screen Stars','Jerzees','Nessun brand'];

const W = 'wtop', WB = 'wbot', WS = 'wshoes', M = 'mtop', MB = 'mbot', MS = 'mshoes', ONE = 'one', NONE = 'none', BELT = 'belt', HAT = 'hat', GLV = 'glove', RING = 'ring';
const wLetters = ['XXXS / 34','XXS / 36','XS / 38','S / 40','M / 42','L / 44','XL / 46','XXL / 48','XXXL / 50','4XL / 52','5XL / 54','6XL / 56'];
const wW = ['W23','W24','W25','W26','W27','W28','W29','W30','W31','W32','W33','W34','W36','W38','W40'];
const mLetters = ['XS / 44','S / 46','M / 48','L / 50','XL / 52','XXL / 54','XXXL / 56','4XL / 58','5XL / 60'];
const mW = ['W26 / IT 40','W27 / IT 41','W28 / IT 42','W29 / IT 43','W30 / IT 44','W31 / IT 45','W32 / IT 46','W33 / IT 47','W34 / IT 48','W35 / IT 49','W36 / IT 50','W38 / IT 52','W40 / IT 54','W42 / IT 56','W44 / IT 58','W46 / IT 60'];
const shoes = (a, b) => { const o = []; for (let s = a; s <= b; s += .5) o.push('EU ' + (Number.isInteger(s) ? s : s.toFixed(1).replace('.', ','))); return o; };
const SIZES = {
  wtop: [...wLetters, 'Taglia unica', 'Altro'],
  wbot: [...wW, ...wLetters, 'Taglia unica', 'Altro'],
  wshoes: [...shoes(34, 43), 'Altro'],
  mtop: [...mLetters, 'Taglia unica', 'Altro'],
  mbot: [...mW, ...mLetters.map(s => s.split(' / ')[0]), 'Altro'],
  mshoes: [...shoes(38, 49), 'Altro'],
  one: ['Taglia unica'],
  belt: ['XS','S','M','L','XL','70 cm','75 cm','80 cm','85 cm','90 cm','95 cm','100 cm','105 cm','110 cm','115 cm','120 cm','125 cm','130 cm','Taglia unica','Altro'],
  hat: ['Taglia unica','XS','S','M','L','XL','54 cm','55 cm','56 cm','57 cm','58 cm','59 cm','60 cm','61 cm','62 cm','Altro'],
  glove: ['Taglia unica','XS','S','M','L','XL','Altro'],
  ring: ['Taglia unica','8','9','10','11','12','13','14','15','16','17','18','19','20','21','22','23','24','25','26','27','28','29','30','Altro'],
  none: null
};
const CATS = {
  'Donna': {
    'Abbigliamento': {
      'Cappotti e giacche': {
        'Cappotti': { 'Cappotti': W, 'Cappotti in lana': W, 'Trench': W, 'Parka': W, 'Piumini e cappotti imbottiti': W, 'Montgomery': W, 'Impermeabili': W, 'Cappotti in pelliccia': W, 'Mantelle e poncho': W },
        'Giacche': { 'Giacche di jeans': W, 'Giacche in pelle': W, 'Blazer': W, 'Bomber': W, 'Giacche a vento': W, 'Piumini e giacche imbottite': W, 'Gilet': W, 'Giacche da biker': W, 'Giacche in camoscio e shearling': W, 'Giacche varsity': W, 'Giacche militari': W, 'Giacche sportive': W, 'Giacche in pile': W, 'Giacche in lana': W, 'Altre giacche': W }
      },
      'Maglioni e felpe': { 'Maglioni': W, 'Cardigan': W, 'Felpe': W, 'Felpe con cappuccio': W, 'Felpe con zip': W, 'Dolcevita': W, 'Gilet in maglia': W, 'Maglioni lunghi': W, 'Poncho': W, 'Boleri': W },
      'Top e t-shirt': { 'T-shirt': W, 'Camicie': W, 'Bluse': W, 'Canotte': W, 'Top a manica lunga': W, 'Top a manica corta': W, 'Top senza spalline': W, 'Crop top': W, 'Body': W, 'Polo': W, 'Tuniche': W, "Top con scollo all'americana": W, 'Top a maniche 3/4': W, 'Altri top': W },
      'Vestiti': { 'Vestiti mini': W, 'Vestiti midi': W, 'Vestiti lunghi': W, 'Vestiti casual': W, 'Vestiti estivi': W, 'Vestiti da sera': W, 'Vestiti da cocktail': W, 'Vestiti eleganti e da cerimonia': W, 'Vestiti invernali': W, 'Vestiti in jeans': W, 'Vestiti in maglia': W, 'Chemisier': W, 'Vestiti a tubino': W, 'Vestiti senza spalline': W, 'Vestiti senza maniche': W, 'Abiti da sposa': W, 'Altri vestiti': W },
      'Gonne': { 'Minigonne': W, 'Gonne midi': W, 'Gonne lunghe': W, 'Gonne a tubino': W, 'Gonne a ruota': W, 'Gonne a pieghe': W, 'Gonne in jeans': W, 'Gonne pantalone': W, 'Gonne a portafoglio': W, 'Gonne asimmetriche': W, 'Altre gonne': W },
      'Pantaloni e leggings': { 'Pantaloni a gamba ampia': WB, 'Pantaloni a sigaretta': WB, 'Pantaloni skinny': WB, 'Pantaloni dritti': WB, 'Pantaloni cropped': WB, 'Pantaloni a zampa': WB, 'Pantaloni cargo': WB, 'Chino': WB, 'Pantaloni palazzo': WB, 'Pantaloni eleganti': WB, 'Pantaloni in pelle': WB, 'Pantaloni tuta': WB, 'Leggings': WB, 'Pantaloni harem': WB, 'Altri pantaloni': WB },
      'Jeans': { 'Jeans skinny': WB, 'Jeans slim': WB, 'Jeans dritti': WB, 'Jeans a gamba larga': WB, 'Jeans boyfriend': WB, 'Jeans mom': WB, 'Jeans a zampa': WB, 'Jeans bootcut': WB, 'Jeans a vita alta': WB, 'Jeans cropped': WB, 'Jeans strappati': WB, 'Altri jeans': WB },
      'Shorts e pantaloncini': { 'Shorts in jeans': WB, 'Shorts a vita alta': WB, 'Shorts cargo': WB, 'Shorts in pelle': WB, 'Shorts eleganti': WB, 'Pantaloncini sportivi': WB, 'Skort e gonne pantaloncino': WB, 'Shorts di lino': WB, 'Altri shorts': WB },
      'Tute e salopette': { 'Tute intere (jumpsuit)': W, 'Playsuit': W, 'Salopette': W, 'Tute da ginnastica': W, 'Tute complete (set)': W, 'Altre tute': W },
      'Abbigliamento sportivo': { 'Top e t-shirt sportive': W, 'Reggiseni sportivi': W, 'Leggings sportivi': WB, 'Pantaloni tuta': WB, 'Pantaloncini sportivi': WB, 'Felpe sportive': W, 'Giacche sportive': W, 'Tute sportive': W, 'Abbigliamento da sci e snowboard': W, 'Abbigliamento da yoga': W, 'Abbigliamento da running': W, 'Abbigliamento da ciclismo': W, 'Altro abbigliamento sportivo': W },
      'Costumi da bagno': { 'Bikini': W, 'Costumi interi': W, 'Tankini': W, 'Copricostume e parei': W, 'Top bikini': W, 'Slip bikini': W, 'Altro mare': W },
      'Lingerie e pigiami': { 'Reggiseni': W, 'Slip e culotte': W, 'Body': W, 'Pigiami': W, 'Camicie da notte': W, 'Vestaglie e kimono': W, 'Calze e collant': W, 'Sottovesti': W, 'Set lingerie': W },
      'Abbigliamento premaman': { 'Top premaman': W, 'Vestiti premaman': W, 'Pantaloni premaman': WB, 'Jeans premaman': WB, 'Giacche premaman': W, 'Altro premaman': W },
      'Altro abbigliamento': { 'Completi e coordinati': W, 'Costumi e cosplay': W, 'Kimono': W, 'Abbigliamento tradizionale': W, 'Altro': W }
    },
    'Scarpe': {
      'Stivali': { 'Stivaletti e tronchetti': WS, 'Stivali al ginocchio': WS, 'Stivali sopra il ginocchio': WS, 'Stivali Chelsea': WS, 'Stivali con tacco': WS, 'Anfibi e biker': WS, 'Stivali da pioggia': WS, 'Stivali da neve': WS, 'Stivali da trekking': WS, 'Stivali in pelle': WS, 'Altri stivali': WS },
      'Ballerine': WS,
      'Décolleté e scarpe con tacco': { 'Décolleté': WS, 'Scarpe con tacco alto': WS, 'Scarpe con tacco medio': WS, 'Scarpe con tacco basso': WS, 'Scarpe con plateau': WS, 'Scarpe con zeppa': WS, 'Slingback': WS, 'Mary Jane': WS },
      'Sandali': { 'Sandali bassi': WS, 'Sandali con tacco': WS, 'Sandali con zeppa': WS, 'Sandali con plateau': WS, 'Infradito': WS, 'Sabot e mule': WS, 'Altri sandali': WS },
      'Scarpe sportive': { 'Sneakers': WS, 'Scarpe da corsa': WS, 'Scarpe da tennis': WS, 'Scarpe da basket': WS, 'Scarpe da calcio': WS, 'Scarpe da trekking': WS, 'Scarpe da palestra e allenamento': WS, 'Scarpe da skate': WS, 'Altre scarpe sportive': WS },
      'Mocassini e scarpe stringate': { 'Mocassini': WS, 'Scarpe stringate': WS, 'Oxford e brogue': WS, 'Scarpe da barca': WS, 'Slip-on': WS, 'Espadrillas': WS },
      'Zoccoli, ciabatte e pantofole': { 'Zoccoli': WS, 'Ciabatte': WS, 'Pantofole': WS, 'Slides': WS },
      'Scarpe da sposa e da cerimonia': WS,
      'Altre scarpe': WS
    },
    'Accessori': {
      'Borse': { 'Borse a mano': NONE, 'Borse a tracolla': NONE, 'Borse a spalla': NONE, 'Zaini': NONE, 'Pochette e clutch': NONE, 'Marsupi': NONE, 'Tote bag e shopper': NONE, 'Borse da viaggio': NONE, 'Borse da spiaggia': NONE, 'Borse da sera': NONE, 'Secchielli': NONE, 'Valigie': NONE, 'Beauty case': NONE, 'Portadocumenti e borse da lavoro': NONE, 'Borse per laptop': NONE, 'Altre borse': NONE },
      'Portafogli e portamonete': { 'Portafogli': NONE, 'Portamonete': NONE, 'Porta carte': NONE, 'Portachiavi': NONE },
      'Cinture': BELT,
      'Sciarpe, foulard e scialli': { 'Sciarpe': ONE, 'Foulard': ONE, 'Scialli e stole': ONE, 'Scaldacollo': ONE, 'Bandane': ONE },
      'Cappelli e berretti': { 'Cappelli': HAT, 'Berretti': HAT, 'Cappellini con visiera': HAT, 'Baschi': HAT, 'Cappelli di paglia': HAT, 'Bucket hat': HAT, 'Fasce': HAT, 'Turbanti': HAT, 'Cappelli invernali': HAT },
      'Guanti': GLV,
      'Gioielli': { 'Collane': NONE, 'Bracciali': NONE, 'Anelli': RING, 'Orecchini': NONE, 'Spille': NONE, 'Cavigliere': NONE, 'Ciondoli e charm': NONE, 'Set di gioielli': NONE, 'Gioielli per il corpo': NONE },
      'Orologi': NONE,
      'Occhiali da sole': NONE,
      'Montature e occhiali da vista': NONE,
      'Accessori per capelli': { 'Cerchietti': NONE, 'Elastici e scrunchie': NONE, 'Mollette e fermagli': NONE, 'Fasce per capelli': NONE, 'Parrucche ed extension': NONE, 'Altri accessori per capelli': NONE },
      'Ombrelli': NONE,
      'Fazzoletti': NONE,
      'Ventagli': NONE,
      'Altri accessori': NONE
    }
  },
  'Uomo': {
    'Abbigliamento': {
      'Jeans': { 'Jeans skinny': MB, 'Jeans slim': MB, 'Jeans dritti': MB, 'Jeans a gamba larga': MB, 'Jeans bootcut': MB, 'Jeans baggy': MB, 'Jeans strappati': MB, 'Jeans cropped': MB, 'Altri jeans': MB },
      'Cappotti e giacche': {
        'Cappotti': { 'Cappotti': M, 'Cappotti in lana': M, 'Trench': M, 'Parka': M, 'Piumini e cappotti imbottiti': M, 'Montgomery': M, 'Impermeabili': M, 'Cappotti in pelliccia': M },
        'Giacche': { 'Giacche di jeans': M, 'Giacche in pelle': M, 'Bomber': M, 'Giacche a vento': M, 'Piumini e giacche imbottite': M, 'Gilet e smanicati': M, 'Giacche da biker': M, 'Giacche varsity e college': M, 'Giacche militari': M, 'Giacche in camoscio e shearling': M, 'Giacche sportive e track jacket': M, 'Harrington': M, 'Giacche da lavoro (workwear)': M, 'Giacche in pile': M, 'Giacche softshell': M, 'Giacche da sci': M, 'Altre giacche': M },
        'Blazer e giacche eleganti': M
      },
      'Felpe e maglioni': { 'Felpe': M, 'Felpe con cappuccio': M, 'Felpe con zip': M, 'Maglioni girocollo': M, 'Maglioni con scollo a V': M, 'Dolcevita': M, 'Cardigan': M, 'Gilet in maglia': M, 'Maglioni in lana': M, 'Maglioni in cashmere': M, 'Altri maglioni': M },
      'Top e t-shirt': { 'T-shirt': M, 'T-shirt a maniche lunghe': M, 'T-shirt stampate': M, 'T-shirt a righe': M, 'T-shirt tinta unita': M, 'Canotte': M, 'Polo': M, 'Camicie casual': M, 'Camicie eleganti': M, 'Camicie di jeans': M, 'Camicie in flanella e a quadri': M, 'Camicie a maniche corte': M, 'Camicie di lino': M, 'Camicie hawaiane': M, 'Altri top': M },
      'Completi e blazer': { 'Completi': M, 'Blazer': M, 'Giacche eleganti': M, 'Pantaloni eleganti': MB, 'Gilet': M, 'Smoking': M },
      'Pantaloni': { 'Chino': MB, 'Pantaloni cargo': MB, 'Pantaloni tuta e jogger': MB, 'Pantaloni eleganti': MB, 'Pantaloni a gamba larga': MB, 'Pantaloni skinny': MB, 'Pantaloni slim': MB, 'Pantaloni dritti': MB, 'Pantaloni in velluto a coste': MB, 'Pantaloni cropped': MB, 'Pantaloni da lavoro': MB, 'Pantaloni di lino': MB, 'Pantaloni in pelle': MB, 'Altri pantaloni': MB },
      'Shorts': { 'Shorts cargo': MB, 'Shorts chino': MB, 'Shorts in jeans': MB, 'Bermuda': MB, 'Pantaloncini sportivi': MB, 'Shorts di lino': MB, 'Altri shorts': MB },
      'Abbigliamento sportivo': { 'Tute sportive': M, 'Giacche sportive': M, 'Pantaloni tuta': MB, 'Pantaloncini sportivi': MB, 'T-shirt sportive': M, 'Felpe sportive': M, 'Maglie da calcio': M, 'Maglie da basket': M, 'Maglie da baseball e football': M, 'Abbigliamento da ciclismo': M, 'Abbigliamento da sci e snowboard': M, 'Abbigliamento da running': M, 'Top termici': M, 'Altro abbigliamento sportivo': M },
      'Costumi da bagno': { 'Boxer da mare': MB, 'Slip da mare': MB, 'Shorts da surf': MB },
      'Intimo e calze': { 'Boxer': M, 'Slip': M, 'Canottiere intime': M, 'Calze e calzini': ONE, 'Pigiami': M, 'Vestaglie e accappatoi': M, 'Intimo termico': M },
      'Abbigliamento da lavoro': { 'Giacche da lavoro': M, 'Pantaloni da lavoro': MB, 'Tute da lavoro': M, 'Camicie da lavoro': M },
      'Altro abbigliamento': { 'Kimono e yukata': M, 'Costumi e cosplay': M, 'Abbigliamento tradizionale': M, 'Altro': M }
    },
    'Scarpe': {
      'Scarpe sportive': { 'Sneakers': MS, 'Scarpe da corsa': MS, 'Scarpe da basket': MS, 'Scarpe da calcio': MS, 'Scarpe da tennis': MS, 'Scarpe da skate': MS, 'Scarpe da trekking': MS, 'Scarpe da palestra e allenamento': MS, 'Scarpe da golf': MS, 'Scarpe da ciclismo': MS, 'Altre scarpe sportive': MS },
      'Stivali': { 'Stivali Chelsea': MS, 'Stivaletti e desert boots': MS, 'Anfibi e biker': MS, 'Stivali da lavoro': MS, 'Stivali da trekking': MS, 'Stivali da pioggia': MS, 'Stivali da neve': MS, 'Stivali in pelle': MS, 'Altri stivali': MS },
      'Scarpe eleganti': { 'Oxford': MS, 'Derby': MS, 'Brogue': MS, 'Monk strap': MS, 'Scarpe stringate': MS, 'Altre scarpe eleganti': MS },
      'Mocassini e slip-on': { 'Mocassini': MS, 'Scarpe da barca': MS, 'Slip-on': MS, 'Espadrillas': MS, 'Driving shoes': MS },
      'Sandali e ciabatte': { 'Sandali': MS, 'Infradito': MS, 'Ciabatte e slides': MS, 'Pantofole': MS, 'Zoccoli': MS },
      'Altre scarpe': MS
    },
    'Accessori': {
      'Borse e zaini': { 'Zaini': NONE, 'Borse a tracolla': NONE, 'Marsupi': NONE, 'Borse da viaggio': NONE, 'Borse portadocumenti e ventiquattrore': NONE, 'Borse da palestra': NONE, 'Tote bag': NONE, 'Borselli': NONE, 'Valigie': NONE, 'Beauty case': NONE, 'Borse per laptop': NONE, 'Altre borse': NONE },
      'Portafogli': { 'Portafogli': NONE, 'Portamonete': NONE, 'Porta carte': NONE, 'Fermasoldi': NONE, 'Portachiavi': NONE },
      'Cinture': BELT,
      'Cappelli e berretti': { 'Cappellini con visiera': HAT, 'Berretti': HAT, 'Cappelli': HAT, 'Bucket hat': HAT, 'Coppole': HAT, 'Cappelli in feltro': HAT, 'Cappelli di paglia': HAT, 'Fasce e scaldaorecchie': HAT, 'Cappelli invernali': HAT },
      'Sciarpe e scialli': { 'Sciarpe': ONE, 'Foulard e bandane': ONE, 'Scaldacollo': ONE },
      'Guanti': GLV,
      'Cravatte e papillon': { 'Cravatte': ONE, 'Papillon': ONE, 'Fermacravatte': NONE, 'Fazzoletti da taschino': ONE },
      'Gioielli': { 'Collane': NONE, 'Bracciali': NONE, 'Anelli': RING, 'Orecchini': NONE, 'Spille': NONE, 'Gemelli': NONE, 'Ciondoli': NONE },
      'Orologi': NONE,
      'Occhiali da sole': NONE,
      'Montature e occhiali da vista': NONE,
      'Bretelle': ONE,
      'Ombrelli': NONE,
      'Fazzoletti': NONE,
      'Altri accessori': NONE
    }
  }
};
const LEAVES = [];
(function walk(node, path) { for (const [k, v] of Object.entries(node)) { if (typeof v === 'string') LEAVES.push({ label: k, path: [...path, k], sizeGroup: v }); else walk(v, [...path, k]); } })(CATS, []);


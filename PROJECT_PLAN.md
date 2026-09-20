# F24 File System — projektni plan

## Svrha dokumenta

Ovaj dokument je zajednički izvor istine za izradu F24 interview zadatka. Sadrži potvrđene odluke, granice opsega, predloženu arhitekturu, faze implementacije i kriterije završetka.

Rad se odvija postupno. Prije početka svake veće faze provjeravamo plan i dogovaramo eventualne promjene. Nakon svake radne sesije ažuriramo checklistu i zapis napretka na kraju dokumenta.

Oznake:

- `[ ]` nije započeto
- `[~]` u tijeku
- `[x]` završeno i provjereno
- `[!]` blokirano ili zahtijeva odluku

## Trenutačno stanje

- [x] Pročitan je izvorni zadatak iz `task.txt`.
- [x] Dogovoreni su funkcionalni i tehnički smjerovi opisani u ovom dokumentu.
- [x] Git repozitorij je inicijaliziran na grani `main`.
- [x] Frontend i Laravel backend osnove su scaffoldane i provjerene.
- [x] Docker Compose podiže frontend, API, queue worker i zdravu PostgreSQL bazu.
- [x] Faza 2: baza i backend jezgra su implementirane i provjerene.
- [x] Faza 3: exact search i prefix suggestions su implementirani i provjereni.
- [x] Faza 4: rekurzivni Delete, queue purge i backend-controlled Undo su provjereni.
- [x] Sve faze implementacije i završna provjera predaje su dovršene.

---

## 1. Cilj zadatka

Izraditi browser-based file system sličan pojednostavljenom Dropboxu ili Windows Exploreru.

Korisnik mora moći:

- stvarati mape i podmape
- stvarati datoteke unutar mapa
- pretraživati datoteke po točnom nazivu
- pretraživati unutar odabrane mape ili kroz cijeli sustav
- tijekom tipkanja dobiti najviše 10 datoteka čiji naziv počinje traženim tekstom
- brisati datoteke i cijela stabla mapa

Prema specifikaciji, datoteka je samo zapis s nazivom i nema binarni sadržaj.

## 2. Kriteriji evaluacije

Rješenje mora zadovoljiti sljedeće kriterije iz zadatka i dodatne poruke poslodavca:

- aplikacija se pokreće end-to-end isključivo prema uputama u README-u
- jasna podjela API, data i UI slojeva
- čitljivi nazivi i namjerna struktura repozitorija
- bez mrtvog koda, demo scaffolding ostataka i nepotrebnih dependencyja
- ispravna HTTP semantika na happy pathu
- precizna usklađenost sa specifikacijom
- smislen model podataka
- osnovno rukovanje greškama i validacija ulaza
- testovi osnovne poslovne logike i happy patha
- iskren README s navedenim ograničenjima i trade-offovima
- aplikacija se mora buildati i pokretati u debug/development načinu rada
- završno rješenje mora biti predano kao Git repozitorij

---

## 3. Potvrđeni tehnološki stack

### Frontend

- React
- TypeScript
- Vite
- Tailwind CSS
- React Router za URL-based navigaciju
- TanStack Query za dohvaćanje, cacheiranje i osvježavanje API podataka
- `@react-symbols/icons` iza naše reusable `EntryIcon` komponente
- Vitest i React Testing Library
- Playwright za mali broj end-to-end testova

### Backend

- PHP
- Laravel kao REST API
- Laravel database queue za odgođeno trajno brisanje
- PHPUnit/Laravel testni alati

### Baza i infrastruktura

- PostgreSQL
- Docker Compose
- zasebni servisi za frontend, API, queue worker i bazu
- healthcheck baze i kontrolirani redoslijed pokretanja servisa

Dogovorena verzijska osnova nakon provjere službene dokumentacije:

- Laravel 13
- PHP 8.4 za Docker image; Laravel 13 zahtijeva najmanje PHP 8.3
- PostgreSQL 18
- Node.js 24 za frontend Docker image i development tooling
- aktualni kompatibilni React i Vite, zaključani generiranim `package-lock.json`
- Tailwind CSS 4 sa službenim Vite pluginom

Sve konkretne dependency verzije zaključava Composer/npm lockfile. Ne koristimo plutajuće verzije u reproducibilnom buildu.

### 3.1 Potpuni stack i odgovornost svakog dijela

| Sloj | Odabir | Odgovornost i razlog odabira |
|---|---|---|
| UI biblioteka | React | Komponentno korisničko sučelje za file explorer |
| Jezik frontenda | TypeScript u strict načinu | Tipovi API odgovora, sigurniji refactoring i čitljiviji ugovori između komponenti |
| Frontend build alat | Vite | Brz development server, jednostavan React/TypeScript build i malo nepotrebnog scaffolding koda |
| Stilovi | Tailwind CSS | Brza izrada dosljednog, profesionalnog sučelja bez uvođenja cijelog UI frameworka |
| Routing | React Router | URL predstavlja otvorenu mapu; podržava deep link, refresh i navigaciju kroz breadcrumbs |
| Server-state | TanStack Query | Dohvaćanje, cacheiranje, invalidacija i ponovno učitavanje stabla, sadržaja, searcha i Undo stanja |
| HTTP klijent | Native `fetch` iza našeg API sloja | Dovoljan za ovaj opseg; izbjegava dependency koji nema jasnu dodatnu vrijednost |
| File ikone | `@react-symbols/icons` | Velik skup React/TypeScript SVG ikona i automatski izbor prema nazivu/ekstenziji |
| UI postavke | Browser localStorage | Postavke ostaju nakon refresha i zatvaranja browsera; nema potrebe slati ih backendu |
| Backend jezik | PHP | Zahtjev i dogovoreni backend smjer |
| Backend framework | Laravel | Routing, validacija, ORM, migracije, queue, JSON API i testna infrastruktura |
| API stil | Verzijski REST JSON API pod `/api/v1` | Jasna separacija frontenda i backenda te pravilna HTTP semantika |
| ORM | Laravel Eloquent | Modeli, relacije i uobičajeni upiti; složeni rekurzivni upiti mogu koristiti query builder/raw SQL kada je jasnije |
| SQL baza | PostgreSQL | Relacijski integritet, transakcije, indeksi i recursive CTE upiti za hijerarhijske podatke |
| Queue | Laravel database queue | Pouzdano odgođeno trajno brisanje bez dodatnog Redis servisa |
| Backend testovi | PHPUnit kroz Laravel test tooling | Feature/integration testovi API-ja, baze, vremena i poslovnih pravila |
| Frontend testovi | Vitest + React Testing Library | Testiranje ponašanja komponenti i integracije s korisničkog stajališta |
| E2E testovi | Playwright | Provjera najvažnijih tokova kroz stvarni frontend, API i bazu |
| Kontejnerizacija | Docker + Docker Compose | Reproducibilno end-to-end pokretanje prema README-u |
| Verzijska kontrola | Git | Obvezan način predaje i jasna povijest namjernih promjena |

### 3.2 Planirani frontend dependencyji

Ovo je namjerni početni skup. Svaki dependency mora opravdati svoje postojanje prije instalacije.

- `react` i `react-dom`
- `react-router-dom`
- `@tanstack/react-query`
- `@react-symbols/icons`
- Tailwind CSS i službeni alat potreban za aktualnu Vite integraciju
- `vitest`
- `@testing-library/react`
- `@testing-library/user-event`
- `@testing-library/jest-dom`
- `playwright` ili `@playwright/test`

Ne planira se Redux jer je većina stanja serverska, a preostalo lokalno UI stanje je malo. Ne planira se Axios dok native `fetch` zadovoljava potrebe. Ne uvodi se zaseban veliki component framework jer želimo vlastiti, lagan Tailwind dizajn.

Ako tijekom implementacije modalima treba provjerena accessibility primitiva, prije dodavanja male headless biblioteke zasebno ćemo procijeniti dependency i zapisati odluku.

### 3.3 Planirani backend dependencyji

- Laravel framework i njegove standardne komponente
- PostgreSQL PHP driver
- database queue koji dolazi kroz Laravelovu queue infrastrukturu
- PHPUnit/Laravel testni alati
- Laravel Pint za dosljedno PHP formatiranje
- PHPStan/Larastan samo ako ga možemo uredno uključiti u quality gate bez nepotrebnog konfiguracijskog tereta

Ne planira se Redis jer database queue zadovoljava Undo/purge opseg. Ne planira se filesystem ili object-storage paket jer datoteke nemaju binarni sadržaj. Ne uvodimo Repository paket ni dodatni ORM.

### 3.4 Registar potvrđenih odluka

Ovaj sažetak čuva ne samo *što* koristimo nego i *zašto*, kako se odluke ne bi izgubile ako se razgovor prekine.

| Tema | Potvrđena odluka | Razlog / posljedica |
|---|---|---|
| SQL baza | PostgreSQL | PostgreSQL je SQL baza i u potpunosti zadovoljava zadatak |
| Model stabla | Jedna `entries` tablica s `parent_id` | Jednostavan adjacency-list model, prirodan za CRUD i recursive CTE |
| Datoteke i mape | Dijele istu tablicu i namespace unutar roditelja | Jedno pravilo naziva i jednostavnije stablo |
| Root | Sistemski zapis koji se ne briše i ne preimenuje | Izbjegava posebna `NULL parent` pravila za obične zapise |
| Sadržaj datoteke | Ne postoji; sprema se samo puni naziv | Strogo prati zadatak i izbjegava nepotreban upload/storage opseg |
| New file | Modal s ručnim unosom poput `file.docx` | Nema Browse gumba ni drag-and-drop uploada |
| Dupli naziv pri createu | Automatski `(1)`, `(2)` prije ekstenzije | Predvidljivo ponašanje slično file exploreru |
| Konflikt pri renameu | Prikaz greške, bez automatskog suffixa | Korisnik mora svjesno odabrati novi naziv |
| Case sensitivity | Nazivi i search uspoređuju se case-insensitive | `Report.pdf` i `report.pdf` smatraju se istim nazivom |
| Brisanje | Odmah se šalje backendu i postaje privremeno | Browser nije autoritet za trajno brisanje |
| Undo rok | 10 sekundi | Dovoljno vremena za reakciju bez dugog zadržavanja pending stanja |
| Undo token | Jedan nepredvidivi token po korisničkoj delete akciji | Cijelo podstablo vraća se kao jedna grupa |
| Purge | Delayed Laravel database queue job | Radi čak i ako se tab zatvori ili osvježi |
| Više brisanja | Svaka deletion grupa ima vlastiti toast | Moguće je pojedinačno vratiti više uzastopnih brisanja |
| Toast položaj | Donji desni kut, iznad cijele aplikacije | Ostaje vidljiv tijekom navigacije |
| Refresh tijekom Undoa | Frontend dohvaća pending deletion grupe | Undo se ne gubi osvježavanjem stranice |
| Search UI | Jedno polje + `Search everywhere` checkbox | Nema dvije odvojene tražilice |
| Lokalni search | Rekurzivno kroz otvorenu mapu i sve podmape | Moćniji folder-scoped search |
| Globalni search | Sve aktivne datoteke | Izvršava zahtjev “across all files” |
| Placeholderi | `Search this folder` / `Searching everywhere` | Jasno komuniciraju aktivni scope |
| Suggestions | Starts-with, najviše 10 | Precizna usklađenost sa specifikacijom |
| Exact search | Case-insensitive točan naziv datoteke | Odvojeno ponašanje od suggestionsa |
| Sidebar | Klikabilno, sklopivo stablo svih zapisa | Mape otvaraju glavni prikaz, a datoteke su završni listovi |
| Breadcrumbs | Klikabilni preci | Brza izravna navigacija prema višoj mapi |
| Prikaz sadržaja | List default, grid/card opcionalno | Profesionalan detaljni prikaz i korisnička preferencija |
| Ekstenzije | Vizualni on/off, stvarni naziv se ne mijenja | Postavka ne utječe na API, search, duplicate ili rename logiku |
| UI persistence | localStorage | Ostaje nakon zatvaranja browsera; cookie nije potreban |
| Ikone | Biblioteka iza naše `EntryIcon` komponente | Jedna zamjenjiva integracijska točka i fallback za nepoznate tipove |
| Folder ikone | Različit prikaz prazne i neprazne mape | `hasChildren` se izvodi iz aktivnog sadržaja |
| New akcija | Floating gumb u donjem lijevom kutu | Otvara izbornik `New folder` / `New file` |
| Modali | Shared modal infrastruktura | Create, rename i delete ne dupliciraju ponašanje |
| Boje | Bijelo/svijetlosivo uz semantičke akcijske boje | Zeleno create/success, crveno delete, plavo info/Undo, narančasto warning |
| Mobilni dizajn | Nije cilj zadatka | Desktop browser sučelje ima prioritet |
| Clean arhitektura | Tanke HTTP klase + domenske Actions/Services | Jasne odgovornosti bez nepotrebnog enterprise boilerplatea |
| Repository pattern | Ne uvodi se bez stvarne potrebe | Eloquent je dovoljan; izbjegava se ceremonijalni sloj |
| Docker | Uključen | Olakšava evaluaciju i donosi dodatnu vrijednost zadatku |
| README | Potpun, reproducibilan i iskren | Navodi setup, testove, arhitekturu, trade-offove i poznate nedostatke |

### 3.5 Odluke koje još nisu zaključane

Sljedeće nisu zaboravljene; namjerno su ostavljene za Fazu 0 ili trenutak kada imamo dovoljno tehničkog konteksta:

- konačan naziv aplikacije
- točne zaključane verzije PHP-a, Laravela, Nodea, Reacta, PostgreSQL-a i Tailwinda
- konkretan tip primarnog ID-ja (`UUID`/`ULID` ili drugi prikladan izbor)
- treba li sidebar collapse ući u prvu verziju ili samo ako ostane vremena
- treba li dodati malu headless accessibility biblioteku za modal/menu primitive
- konačne nijanse boja, tipografija i dimenzije nakon prvog UI prototipa

Promjena bilo koje potvrđene odluke upisuje se u ovaj dokument prije ili zajedno s implementacijom.

---

## 4. Opseg projekta

### 4.1 Obvezna funkcionalnost

- stvaranje mapa i podmapa
- stvaranje datoteke ručnim unosom punog naziva, npr. `izvjestaj.docx`
- prikaz sadržaja odabrane mape
- pretraga datoteka po točnom nazivu
- globalna i folder-scoped pretraga
- najviše 10 prefix prijedloga tijekom tipkanja
- brisanje datoteke ili cijelog stabla mape
- README s potpunim uputama
- Docker razvojno okruženje
- testovi temeljne logike

### 4.2 Dogovorene dodatne funkcionalnosti

- Undo brisanja u roku od 10 sekundi
- backend je autoritet za Undo rok i trajno brisanje
- više paralelnih Undo obavijesti
- vraćanje aktivnih Undo obavijesti nakon refresha
- automatsko rješavanje duplih naziva pri stvaranju
- preimenovanje datoteka i mapa
- klikabilno stablo mapa i prikaz datoteka u sidebaru
- klikabilni breadcrumbs
- list prikaz kao zadani i grid/card prikaz kao opcija
- skrivanje/prikaz ekstenzija kao isključivo vizualna postavka
- ikone prema ekstenziji datoteke
- različit prikaz prazne i neprazne mape
- localStorage za UI postavke
- profesionalan empty state

### 4.3 Namjerno izvan opsega

- autentikacija i autorizacija
- stvarni upload ili download sadržaja datoteke
- spremanje binarnog sadržaja
- mobilno optimiziran dizajn
- dijeljenje datoteka
- verzioniranje datoteka
- permissions sustav
- drag-and-drop premještanje zapisa
- premještanje datoteka i mapa između roditelja, osim ako ga naknadno izričito dogovorimo
- produkcijski cloud deployment

---

## 5. Model podataka

### 5.1 Model stabla

Koristi se adjacency-list model: svaki zapis pokazuje na neposrednog roditelja preko `parent_id`.

Datoteke i mape nalaze se u zajedničkoj tablici `entries`. Time dobivamo jedno stablo i jedno pravilo jedinstvenosti naziva unutar mape.

Postoji jedan sistemski Root zapis:

- Root nema roditelja
- Root se ne može obrisati
- Root se ne može preimenovati
- svi zapisi najviše razine imaju Root kao roditelja

### 5.2 Predložena tablica `entries`

| Stupac | Svrha |
|---|---|
| `id` | Primarni identifikator zapisa |
| `parent_id` | Neposredna roditeljska mapa |
| `type` | `file` ili `folder` |
| `name` | Puni naziv, uključujući ekstenziju datoteke |
| `deleted_at` | Vrijeme privremenog brisanja |
| `deletion_batch_id` | Veza na Undo grupu |
| `created_at` | Vrijeme stvaranja |
| `updated_at` | Vrijeme zadnje izmjene |

### 5.3 Predložena tablica `deletion_batches`

Jedno korisničko brisanje predstavlja jednu grupu, čak i kada briše cijelo podstablo.

| Stupac | Svrha |
|---|---|
| `id` | Interni identifikator grupe |
| `token` | Javni, nepredvidivi Undo token |
| `root_entry_id` | Zapis na kojem je brisanje pokrenuto |
| `expires_at` | Krajnje vrijeme za Undo |
| `status` | `pending`, `restored` ili `purged` |
| `created_at` | Vrijeme pokretanja brisanja |
| `updated_at` | Vrijeme zadnje promjene statusa |

Zapisi i Undo grupe koriste PostgreSQL UUID primarne ključeve, a Undo token je zaseban nasumični UUID. Constrainti i indeksi definirani su u migracijama i provjereni na izoliranoj PostgreSQL testnoj bazi.

### 5.4 Pravila podataka

- roditelj svakog običnog zapisa mora postojati i mora biti mapa
- nije dopušten ciklus u stablu
- datoteka ne može biti roditelj drugom zapisu
- naziv je jedinstven unutar iste roditeljske mape, neovisno o velikim i malim slovima
- datoteke i mape dijele isti prostor naziva
- privremeno obrisani zapisi rezerviraju naziv do trajnog brisanja
- obrisani zapisi ne pojavljuju se u normalnim listama, stablu ili pretrazi
- prazna/neprazna mapa određuje se prema aktivnoj djeci

---

## 6. Pravila naziva i validacija

Naziv datoteke ili mape:

- obvezan je
- nakon trimanja mora imati od 1 do 255 znakova
- smije sadržavati unutarnje razmake
- smije sadržavati donju crtu `_`
- smije sadržavati točke i ekstenzije
- ne smije biti `.` ili `..`
- ne smije sadržavati `/`, `\\` ni kontrolne znakove
- ne smije se sastojati samo od praznih znakova

Primjeri dopuštenih naziva:

- `Moj dokument.docx`
- `zavrsni_izvjestaj_2026.pdf`
- `Projekt broj 1`
- `arhiva.v1.final.zip`

### 6.1 Dupli nazivi pri stvaranju

Kod stvaranja se automatski dodaje prvi slobodan broj:

```text
report.pdf
report (1).pdf
report (2).pdf

Fotografije
Fotografije (1)
Fotografije (2)
```

Broj se kod datoteka dodaje prije posljednje ekstenzije.

Generiranje naziva mora biti sigurno pri istodobnim zahtjevima: baza nameće jedinstvenost, a backend kontrolirano ponavlja pokušaj ako dođe do race conditiona.

### 6.2 Preimenovanje

- preimenovanje koristi zasebnu akciju i `PATCH` endpoint
- za postojeći naziv unutar iste mape vraća se jasna conflict/validation greška
- kod ručnog preimenovanja naziv se ne mijenja automatski u `(1)`
- preimenovanje mape ne zahtijeva izmjenu potomaka jer se veze temelje na ID-jevima
- kada su ekstenzije vizualno skrivene, Rename modal i dalje jasno prikazuje osnovni naziv i ekstenziju
- namjerna promjena ekstenzije je dopuštena i mijenja prikazanu ikonu

---

## 7. Brisanje i Undo

### 7.1 Tijek brisanja

1. Frontend odmah šalje zahtjev za brisanje.
2. Backend u jednoj transakciji pronalazi zapis i sve potomke.
3. Backend stvara `deletion_batch` s rokom od 10 sekundi.
4. Cijelo podstablo označava se privremeno obrisanim i povezuje s istom grupom.
5. Backend zakazuje delayed queue job.
6. API vraća token i apsolutno vrijeme isteka.
7. Frontend prikazuje globalnu Undo obavijest.
8. Ako Undo nije zatražen na vrijeme, worker trajno briše grupu.

Frontend timer nije autoritet. On samo prikazuje razliku između `expiresAt` koji je vratio backend i trenutačnog vremena.

### 7.2 Undo ponašanje

- Undo toast nalazi se u donjem desnom kutu iznad ostatka sučelja
- toast ostaje aktivan tijekom navigacije između mapa
- korisnik može normalno obavljati druge radnje dok timer traje
- svako brisanje ima vlastiti token i vlastiti toast
- nakon refresha frontend dohvaća još aktivne deletion grupe
- Undo vraća cijelu grupu, uključujući sve potomke obrisane tom akcijom
- Undo nakon isteka vraća jasnu grešku i ne vraća sadržaj
- queue job mora biti idempotentan i siguran ako se pokrene više puta

---

## 8. Pretraga

Postoji jedno search polje i checkbox `Search everywhere`.

### 8.1 Scope

Kada checkbox nije označen:

- placeholder je `Search this folder`
- pretraga je rekurzivna kroz trenutačnu mapu i sve njezine podmape

Kada je checkbox označen:

- placeholder je `Searching everywhere`
- pretraga obuhvaća sve aktivne datoteke u sustavu

### 8.2 Exact search

- pretražuju se datoteke, kako zahtijeva specifikacija
- usporedba naziva je case-insensitive
- rezultat prikazuje naziv, ikonu i punu breadcrumb putanju
- klik na rezultat otvara njegovu roditeljsku mapu i označava datoteku

### 8.3 Prefix suggestions

- pokreću se tijekom tipkanja nakon kratkog debouncea
- logika je isključivo `starts with`
- vraća se najviše 10 aktivnih datoteka
- poštuje se odabrani scope
- rezultati imaju determinističan redoslijed
- zastarjeli frontend zahtjevi moraju se otkazati ili ignorirati

---

## 9. UX i vizualni dizajn

### 9.1 Stil

- profesionalan, čist i nenametljiv izgled
- bijele i svijetlosive površine
- tamnosivi čitljivi tekst
- jedna primarna akcentna boja
- zelena za stvaranje i uspjeh
- crvena za destruktivne radnje
- plava za informacije i Undo
- narančasta za upozorenja
- dosljedni border radius, razmaci, hover, focus i disabled stilovi
- boja uvijek ima i tekstualni/ikonski signal; ne smije biti jedini nositelj značenja

### 9.2 App shell

#### Header

- naziv ili mali logo aplikacije
- glavno search polje
- checkbox `Search everywhere`
- Settings izbornik

#### Lijevi sidebar

- hijerarhijsko stablo mapa i datoteka
- Root je uvijek na vrhu
- grane se mogu otvoriti i zatvoriti
- aktivna mapa je jasno označena
- klik na mapu otvara je u glavnom prikazu
- sidebar se može skupiti ako to ne komplicira osnovnu implementaciju

#### Glavni sadržaj

- klikabilni breadcrumbs
- naslov trenutačne mape
- toggle između list i grid prikaza
- sadržaj trenutačne mape
- kontekstualne akcije za svaki zapis

### 9.3 Navigacija

- URL predstavlja trenutačno otvorenu mapu
- klik u sidebaru, breadcrumbu ili search rezultatu ažurira URL
- breadcrumbs služe za izravan odlazak u bilo kojeg pretka
- deep link i refresh moraju ponovno otvoriti istu mapu

### 9.4 List i grid prikaz

List je zadani prikaz.

Predloženi stupci:

```text
Name | Type | Created | Actions
```

Ne prikazuje se izmišljena veličina jer datoteke nemaju sadržaj.

Grid koristi iste podatke, ikone i akcije. Poslovna logika se ne duplicira između `EntryList` i `EntryGrid`.

Odabrani prikaz sprema se u localStorage.

### 9.5 Stvaranje zapisa

U donjem lijevom kutu nalazi se floating `New` gumb s ikonom plus i tooltipom.

Klik otvara izbornik:

- `New folder`
- `New file`

Obje akcije koriste reusable modal infrastrukturu:

- New folder traži naziv mape
- New file traži puni naziv datoteke, npr. `file.docx`
- nema Browse gumba, drag-and-dropa ni uploada sadržaja
- modal prikazuje validacijske greške bez zatvaranja
- nakon uspjeha osvježava se trenutačni sadržaj i relevantno stablo

### 9.6 Empty state

Kada je mapa prazna prikazuje se nenametljiva poruka, npr.:

```text
This folder is empty.
Create a folder or file to get started.
```

Empty state i floating gumb koriste istu create logiku; nema duplicirane implementacije.

### 9.7 Ekstenzije i ikone

- `Show file extensions` je isključivo vizualna postavka
- stvarni naziv u bazi i API-ju uvijek ostaje cijeli
- postavka se sprema u localStorage i ostaje nakon zatvaranja browsera
- skrivanje ekstenzije ne mijenja pretragu, duplikate, rename ili API podatke
- `EntryIcon` je jedino mjesto koje direktno koristi biblioteku ikona
- poznate ekstenzije dobivaju pripadajuću ikonu
- nepoznata ekstenzija dobiva generičku file ikonu
- prazna i neprazna mapa imaju različit prikaz

---

## 10. Predložena API površina

Konačni nazivi ruta mogu se blago prilagoditi tijekom implementacije, ali semantika mora ostati jasna i REST konzistentna.

| Metoda i ruta | Namjena | Uspješan status |
|---|---|---|
| `GET /api/v1/folders/{id}/entries` | Sadržaj mape | `200` |
| `GET /api/v1/entries/tree` | Aktivno stablo mapa i datoteka | `200` |
| `GET /api/v1/entries/{id}/breadcrumbs` | Putanja do zapisa/mape | `200` |
| `POST /api/v1/entries` | Stvaranje datoteke ili mape | `201` |
| `PATCH /api/v1/entries/{id}` | Preimenovanje | `200` |
| `DELETE /api/v1/entries/{id}` | Privremeno brisanje i scheduling | `202` |
| `POST /api/v1/deletions/{token}/undo` | Vraćanje deletion grupe | `200` |
| `GET /api/v1/deletions/pending` | Aktivni Undo timeri | `200` |
| `GET /api/v1/files/search` | Exact-name search | `200` |
| `GET /api/v1/files/suggestions` | Najviše 10 prefix rezultata | `200` |

### 10.1 Standardne greške

- `404 Not Found` za nepostojeći ili nedostupan zapis
- `409 Conflict` za konflikt pri ručnom preimenovanju
- `422 Unprocessable Content` za validacijske greške
- `500 Internal Server Error` za neočekivanu grešku, bez otkrivanja internih detalja

API greške trebaju imati jedan dosljedan JSON oblik, primjerice:

```json
{
  "message": "The given data was invalid.",
  "errors": {
    "name": ["An entry with this name already exists."]
  }
}
```

---

## 11. Organizacija repozitorija

```text
/
├── backend/
├── frontend/
├── docker/
├── compose.yaml
├── .env.example
├── README.md
├── PROJECT_PLAN.md
└── task.txt
```

### 11.1 Backend

```text
backend/app/
├── Domain/Filesystem/
│   ├── Actions/
│   │   ├── CreateEntry.php
│   │   ├── DeleteEntry.php
│   │   ├── RenameEntry.php
│   │   ├── RestoreDeletion.php
│   │   └── SearchFiles.php
│   ├── Exceptions/
│   └── Services/
│       └── UniqueNameGenerator.php
├── Http/
│   ├── Controllers/Api/V1/
│   ├── Requests/
│   └── Resources/
├── Jobs/
│   └── PurgeDeletedEntries.php
└── Models/
    ├── DeletionBatch.php
    └── Entry.php
```

Pravila:

- controller prima HTTP zahtjev, poziva use case i oblikuje odgovor
- Form Request klase validiraju ulaz
- Resource klase određuju API izlaz
- poslovna operacija nalazi se u jasno imenovanoj Action klasi
- model sadrži relacije, castove i jednostavne model-specifične upite
- kompleksna poslovna logika ne ide u controller
- ne uvodimo Repository sloj bez stvarne potrebe
- ne stvaramo generičke `Helpers` ili `Utils` mape bez jasnog vlasništva

### 11.2 Frontend

```text
frontend/src/
├── app/
│   ├── router/
│   ├── providers/
│   └── styles/
├── features/filesystem/
│   ├── api/
│   ├── components/
│   ├── hooks/
│   ├── types/
│   └── utils/
├── pages/
└── shared/
    ├── components/
    ├── hooks/
    └── lib/
```

Planirane reusable cjeline:

- `AppShell`
- `FolderTree`
- `Breadcrumbs`
- `EntryIcon`
- `EntryName`
- `EntryActions`
- `EntryList`
- `EntryGrid`
- `CreateEntryDialog`
- `RenameEntryDialog`
- `DeleteEntryDialog`
- `SearchBox`
- `SearchResults`
- `UndoToast`
- `UndoToastRegion`
- query/mutation hookovi za entries, search i deletion grupe

Reusable komponenta uvodi se kada centralizira stvarno ponašanje ili uklanja stvarno ponavljanje. Ne pretvaramo svaki mali HTML element u apstrakciju.

---

## 12. Docker i razvojno okruženje

Predloženi Compose servisi:

- `frontend` — Vite development server
- `api` — Laravel API u debug/development načinu
- `worker` — Laravel queue worker iz iste backend slike
- `db` — PostgreSQL s persistent volumeom i healthcheckom
- po potrebi jednokratni migration/init servis

Cilj je da evaluator nakon kloniranja može slijediti README bez lokalne instalacije PHP-a, Composera, Nodea ili PostgreSQL-a, osim Dockera.

Potrebno je osigurati:

- reproducibilan build
- zaključane dependency verzije kroz lock datoteke
- `.env.example` bez tajni
- čekanje na zdravu bazu prije API migracija/pokretanja
- persistent development bazu
- dokumentiran clean reset development podataka
- dokumentirane naredbe za backend, frontend i E2E testove

---

## 13. Testna strategija

### 13.1 Backend feature/integration testovi

- [x] stvaranje mape
- [x] stvaranje podmape
- [x] stvaranje datoteke
- [x] odbijanje roditelja koji je datoteka
- [x] validacija naziva
- [x] automatski `(1)`, `(2)` nazivi
- [x] duplikati neovisno o velikim/malim slovima
- [x] race-condition zaštita jedinstvenosti
- [x] listanje samo aktivne neposredne djece
- [x] točna pretraga u trenutnom podstablu
- [x] globalna točna pretraga
- [x] prefix search i limit od 10
- [x] prefix search poštuje scope
- [x] privremeno obrisani zapisi nisu u rezultatima
- [x] brisanje datoteke
- [x] rekurzivno brisanje mape
- [x] Undo unutar 10 sekundi
- [x] Undo nakon isteka
- [x] idempotentno trajno brisanje
- [x] više neovisnih deletion grupa
- [x] preimenovanje datoteke i mape
- [x] konflikt pri preimenovanju
- [x] zaštita Root zapisa pri brisanju
- [x] očekivani HTTP statusi i JSON oblici za create/list/tree/breadcrumbs API

### 13.2 Frontend component/integration testovi

- [x] prikaz sadržaja mape
- [x] list/grid toggle i localStorage
- [x] Show file extensions i localStorage
- [x] ikona prema ekstenziji i fallback ikona
- [x] prazna/neprazna folder ikona
- [x] sidebar navigacija
- [x] klikabilni breadcrumbs
- [x] New izbornik i create modali
- [x] Rename modal
- [x] delete potvrda
- [x] globalni Undo toast tijekom navigacije
- [x] obnova pending Undo stanja nakon refresha
- [x] search placeholder ovisno o checkboxu
- [x] autocomplete s najviše 10 rezultata
- [x] prikaz API grešaka
- [x] empty state

### 13.3 End-to-end happy pathovi

- [x] pokretanje aplikacije iz čistog Docker okruženja
- [x] stvori mapu → otvori je → stvori datoteku → pronađi je
- [x] stvori podmapu → pretraži iz pretka → otvori rezultat
- [x] obriši mapu s potomcima → Undo → potvrdi da je stablo vraćeno
- [x] obriši datoteku → pričekaj istek → potvrdi trajno brisanje
- [x] promijeni prikaz i ekstenzije → refresh → potvrdi spremljene postavke

Testovi trebaju pokrivati osnovni rizik i poslovna pravila. Ne težimo umjetnom postotku pokrivenosti.

---

## 14. Faze implementacije

### Faza 0 — Repo i tehničke verzije

- [x] inicijalizirati Git repozitorij na grani `main`
- [x] dodati početni `.gitignore`
- [x] provjeriti dostupne Git, Docker Compose i Node/npm verzije
- [x] potvrditi da lokalni PHP/Composer nisu potrebni jer se backend izvršava kroz Docker
- [x] odabrati verzijsku osnovu stacka prema službenoj dokumentaciji
- [x] potvrditi radni naziv aplikacije `F24 File System` i slug `f24-filesystem`
- [x] frontend i backend dependency verzije zaključane su u `package-lock.json` i `composer.lock`
- [x] pokrenuti i provjeriti Docker engine
- [x] napraviti prvi namjerni commit s planom i provjerenom frontend osnovom

Kriterij završetka: Git je čist, verzije su dokumentirane i nema aplikacijskog scaffolding otpada.

### Faza 1 — Scaffold i Docker osnova

- [x] scaffoldati Laravel backend
- [x] scaffoldati React + TypeScript + Vite frontend
- [x] postaviti Tailwind CSS 4 kroz službeni Vite plugin
- [x] postaviti React Router i TanStack Query providere
- [x] instalirati `@react-symbols/icons` iza buduće `EntryIcon` integracije
- [x] postaviti Vitest, React Testing Library i početni smoke test
- [x] ukloniti Vite demo sadržaj i assete
- [x] napraviti Dockerfileove i Compose servise
- [x] dodati PostgreSQL healthcheck
- [x] povezati API s bazom
- [x] postaviti CORS za development
- [x] dodati osnovni API health endpoint
- [x] potvrditi debug pokretanje end-to-end

Kriterij završetka: jedna dokumentirana Docker naredba podiže frontend, API, worker i zdravu bazu.

### Faza 2 — Baza i backend jezgra

- [x] migracije za `entries` i `deletion_batches`
- [x] queue tablice i konfiguracija database queuea
- [x] Root seed/init logika
- [x] Eloquent modeli i relacije
- [x] constrainti i indeksi
- [x] CreateEntry action i unique-name generator
- [x] listanje sadržaja mape
- [x] entry tree endpoint za mape i datoteke
- [x] breadcrumbs endpoint
- [x] backend testovi ove faze

Kriterij završetka: API pouzdano stvara i lista hijerarhiju te provodi sva pravila naziva.

### Faza 3 — Pretraga

- [x] rekurzivni folder-scoped exact search
- [x] globalni exact search
- [x] rekurzivni folder-scoped prefix search
- [x] globalni prefix search
- [x] limit 10 i determinističan redoslijed
- [x] indeksiranje i provjera query plana na smislenom skupu podataka
- [x] backend testovi pretrage

Kriterij završetka: oba search moda precizno zadovoljavaju specifikaciju i ignoriraju obrisane zapise.

### Faza 4 — Delete, queue i Undo

- [x] rekurzivni soft delete u transakciji
- [x] kreiranje deletion grupe i tokena
- [x] delayed purge job
- [x] Undo endpoint
- [x] pending deletions endpoint
- [x] zaštita od isteklog ili ponovljenog tokena
- [x] idempotentnost workera
- [x] backend testovi s kontroliranim vremenom

Kriterij završetka: brisanje i Undo rade i bez aktivnog browsera, uključujući refresh i istek roka.

### Faza 5 — Frontend shell i navigacija

- [x] AppShell i osnovni Tailwind design tokeni
- [x] header
- [x] sidebar i potpuno stablo mapa i datoteka
- [x] route za otvorenu mapu
- [x] glavni prikaz sadržaja
- [x] klikabilni breadcrumbs
- [x] loading, error i empty stanja
- [x] frontend testovi navigacije

Kriterij završetka: korisnik može intuitivno pregledavati cijelo stablo i refresh zadržava lokaciju.

### Faza 6 — CRUD UI i preimenovanje

- [x] floating New gumb i izbornik
- [x] reusable modal infrastruktura
- [x] New folder modal
- [x] New file modal s ručnim unosom naziva
- [x] Rename modal
- [x] Delete confirmation modal
- [x] osvježavanje query cachea nakon mutacija
- [x] konzistentne success/error poruke
- [x] frontend testovi akcija

Kriterij završetka: sve create, rename i delete akcije rade kroz UI uz jasnu validaciju.

### Faza 7 — Search, Undo i završni UI detalji

- [x] search input i `Search everywhere` checkbox
- [x] dinamički placeholder
- [x] debounce i zaštita od stale rezultata
- [x] autocomplete rezultati i putanje
- [x] exact search rezultati
- [x] globalni Undo toast region
- [x] više istodobnih Undo toastova
- [x] obnova pending toastova nakon refresha
- [x] list/grid prikaz
- [x] localStorage postavke
- [x] `EntryIcon` i extension mapping
- [x] prazna/neprazna folder ikona
- [x] Show file extensions
- [x] polish hover/focus/disabled stanja

Kriterij završetka: sve dogovorene UX funkcionalnosti rade bez duplicirane poslovne logike.

### Faza 8 — Testovi, robustnost i čišćenje

- [x] dovršiti backend core testove
- [x] dovršiti frontend core testove
- [x] procijeniti Playwright; namjerno izostavljen jer postoje backend feature i frontend integracijski testovi te završni ručni E2E smoke test
- [x] provjeriti input validation i standardni error format
- [x] provjeriti HTTP statuse
- [x] provjeriti keyboard/focus pristupačnost modala i glavnih akcija
- [x] pokrenuti lint, format, typecheck, test i build
- [x] ukloniti demo scaffold, mrtav kod i nekorištene dependencyje
- [x] provjeriti da nema tajni ni lokalnih artefakata u Gitu

Kriterij završetka: svi quality gateovi prolaze iz čistog checkouta.

### Faza 9 — README i završna provjera predaje

- [x] napisati potpune Docker upute od čistog klona
- [x] dokumentirati development/debug pokretanje
- [x] dokumentirati test naredbe
- [x] dokumentirati arhitekturu i model podataka
- [x] dokumentirati API i HTTP semantiku
- [x] dokumentirati odluke i trade-offove
- [x] iskreno navesti sve poznate nedostatke
- [x] ručno proći README na čistom okruženju
- [x] provjeriti Git status i sadržaj repozitorija
- [x] završni end-to-end smoke test

Kriterij završetka: evaluator može samo iz README-a podići, koristiti i testirati rješenje.

---

## 15. Quality gate prije završetka svake sesije

Na kraju svake radne sesije:

- [ ] ažurirati checkliste u ovom dokumentu
- [ ] zapisati što je napravljeno u Session log
- [ ] zapisati točan sljedeći korak
- [ ] pokrenuti testove relevantne za promijenjeni dio
- [ ] provjeriti `git status`
- [ ] ne ostaviti tajne, debug ispise ili slučajne generirane datoteke
- [ ] ne tvrditi da je nešto završeno ako nije provjereno

## 16. Završna definicija gotovog proizvoda

Projekt je gotov kada:

- sva obvezna funkcionalnost i dogovoreni dodaci rade end-to-end
- Docker razvojno okruženje radi prema README-u
- backend, frontend i baza imaju čistu podjelu odgovornosti
- osnovni testovi prolaze
- build, lint i typecheck prolaze
- nema mrtvog koda ni scaffolding ostataka
- HTTP statusi i API greške su konzistentni
- README je potpun i iskren
- Git repozitorij sadrži samo namjerne datoteke

---

## 17. Session log

### Sesija 1 — planiranje

Status: završeno

Napravljeno:

- analiziran izvorni zadatak
- odabran React + TypeScript + Vite frontend
- odabran Laravel backend
- odabran PostgreSQL
- dogovoren adjacency-list model stabla
- dogovoreni search scopeovi i autocomplete
- dogovoren backend-controlled Undo od 10 sekundi
- dogovoreni dupli nazivi, ekstenzije i ikone
- dogovoreni sidebar, breadcrumbs, list/grid i New modal UX
- potvrđeno da nema stvarnog uploada sadržaja
- ugrađeni kriteriji evaluacije iz dodatne poruke poslodavca
- izrađen ovaj projektni plan

Sljedeći korak:

> Prije bilo kakve implementacije zajedno pregledati Fazu 0, zatim uz odobrenje inicijalizirati Git i provjeriti lokalne verzije/Docker okruženje.

### Sesija 2 — početak implementacije

Status: djelomično završeno; Docker engine je vanjski blocker za backend dio

Napravljeno:

- inicijaliziran Git repozitorij na grani `main`
- dodan početni root `.gitignore`
- provjereni Git, Node, npm, Docker CLI i Docker Compose
- potvrđeno da lokalni PHP i Composer nisu instalirani te da će se koristiti kroz Docker
- prema službenoj dokumentaciji odabrani Laravel 13, PHP 8.4, PostgreSQL 18, Node 24 i Tailwind 4
- scaffoldan React + TypeScript + Vite frontend
- instalirani i zaključani dogovoreni runtime i testni dependencyji
- postavljeni Tailwind Vite plugin, React Router i TanStack Query provider
- uklonjen Vite demo sadržaj
- dodan početni smoke test
- uspješno prošli frontend build, lint i test

Blokada:

- Docker Desktop ostaje na `Starting the Docker engine`
- aktivni Docker context je `desktop-linux`, ali njegova WSL distribucija je zaustavljena
- Docker API vraća HTTP 500 čak i uz kompatibilnosnu provjeru starije API verzije
- nije napravljen agresivniji WSL/sistemski zahvat

Sljedeći korak:

> Nakon što Docker Desktop engine normalno proradi, scaffoldati Laravel backend kroz Docker/Composer te dovršiti Compose osnovu. Frontend temelj u međuvremenu je spreman.

### Sesija 3 — Laravel i Docker osnova

Status: završeno

Napravljeno:

- scaffoldan i očišćen Laravel backend
- dodani razvojni CORS i verzionirani API health endpoint
- PostgreSQL postavljen kao zadana baza aplikacije
- dodani Dockerfileovi za backend i frontend
- dodani Compose servisi za PostgreSQL, inicijalne migracije, API, queue worker i frontend
- README proširen provjerenim Docker quick-startom i razvojnim provjerama
- ispravljen PostgreSQL 18 volume path
- ispravljen API healthcheck da unutar Alpine kontejnera koristi IPv4 adresu `127.0.0.1`
- potvrđeno da su baza i API zdravi te da API i frontend vraćaju HTTP 200
- uspješno prošli backend Pint i PHPUnit
- uspješno prošli frontend lint, Vitest i produkcijski build

Sljedeći korak:

> Prije početka Faze 2 zajedno potvrditi konačna polja, tipove, constraintove i indekse tablica `entries` i `deletion_batches`.

### Sesija 4 — baza i backend jezgra

Status: završeno

Napravljeno:

- potvrđena i implementirana UUID adjacency-list shema za `entries`
- implementirane `deletion_batches`, statusni enum i veze potrebne za budući Undo
- dodani PostgreSQL constrainti za tipove, status, jedan Root i konzistentno stanje privremenog brisanja
- dodani case-insensitive unique i prefix indeksi nad nazivima
- Root se stvara idempotentnim seederom
- dodani Eloquent modeli, relacije, enum castovi i factoryji
- implementirani `CreateEntry` i reusable generator slobodnog naziva
- implementirani folder contents, folder tree i breadcrumbs endpointi
- dodani Form Request validacija i jedinstveni API Resource oblik
- dodana izolirana PostgreSQL testna baza koja ne dira razvojne podatke
- ispravljena Docker API server naredba tako da Compose varijable imaju prednost pred lokalnim `.env`
- uspješno prošlo 18 backend testova s 81 assertionom
- potvrđeni stvarni development health i folder tree endpointi

Sljedeći korak:

> Prije Faze 3 zajedno potvrditi query parametre i JSON oblik exact searcha i prefix suggestions endpointa.

### Sesija 5 — exact search i prefix suggestions

Status: završeno

Napravljeno:

- implementiran reusable `SearchFiles` use-case za exact i prefix način rada
- folder scope rekurzivno uključuje odabranu mapu i sve njezine podmape
- globalni scope pretražuje cijelo aktivno stablo
- oba načina uspoređuju nazive neovisno o velikim i malim slovima
- suggestions vraća najviše 10 deterministički sortiranih rezultata
- znakovi poput `%` tretiraju se kao doslovni dio naziva, ne kao wildcard
- mape i privremeno obrisane datoteke isključene su iz rezultata
- svaki rezultat sadrži breadcrumbs od Roota do datoteke
- breadcrumbs se grade u istom rekurzivnom PostgreSQL upitu bez N+1 upita
- dodani query validacija, API Resource i oba verzionirana endpointa
- query plan provjeren na 10.000 privremenih zapisa; PostgreSQL koristi prefix indeks
- uspješno prošlo 26 backend testova sa 120 assertiona
- potvrđen stvarni development search endpoint

Sljedeći korak:

> Prije Faze 4 zajedno potvrditi precizne Delete/Undo statuse za pending, restored, expired i purged grupe.

### Sesija 6 — Delete, queue i Undo

Status: završeno

Napravljeno:

- implementiran rekurzivni soft delete cijelog podstabla u jednoj transakciji
- svako brisanje dobiva nepredvidivi token i backend `expires_at`
- queue job trajno briše podstablo nakon konfigurabilnih 10 sekundi
- purge job je idempotentan i siguran ako se izvrši prerano
- Undo i purge zaključavaju istu deletion grupu pa ne mogu istodobno pobijediti
- Undo unutar roka vraća cijelo podstablo, a ponovljeni Undo je idempotentan
- Undo nakon isteka sinkrono završava purge i vraća `410 Gone`
- pending endpoint vraća aktivne timere i `server_time` za oporavak nakon refresha
- ponovljeni DELETE istog zapisa vraća postojeći `202` bez resetiranja timera
- preklapajuće brisanje roditeljske mape vraća strukturirani `409 Conflict`
- Root je zaštićen od brisanja
- omogućeno je više neovisnih deletion grupa
- privremeno obrisani naziv ostaje rezerviran do purgea
- dodan partial unique indeks za aktivnu deletion grupu istog root zapisa
- uspješno prošlo 39 backend testova sa 193 assertiona
- migracija je primijenjena, worker restartan, a pending endpoint provjeren u developmentu

Sljedeći korak:

> Prije Faze 5 zajedno potvrditi konačni raspored AppShella, sidebar širinu i ponašanje na manjim desktop prozorima.

### Sesija 7 — frontend shell i navigacija

Status: završeno

Napravljeno:

- implementiran AppShell s headerom, sidebarom i glavnim sadržajem
- uveden odvojeni typed API i TanStack Query sloj za stablo, sadržaj i breadcrumbs
- `/folders` se kanonski preusmjerava na stvarni Root URL
- deep link i refresh zadržavaju otvorenu mapu
- implementirano sklopivo stablo s označenom aktivnom mapom
- aktivni put u stablu automatski je otvoren
- mape se mogu otvoriti iz sidebara i glavne liste
- implementirani klikabilni breadcrumbs
- dodani list prikaz te loading, API error/retry i empty stanja
- prema naknadnom dogovoru izostavljen je Back gumb
- dodano pet integracijskih testova navigacije
- uspješno prošli frontend lint, pet Vitest testova i produkcijski build

Sljedeći korak:

> Prije Faze 6 zajedno potvrditi detalje floating New izbornika, modala i ponašanja Rename/Delete akcija u listi.

### Sesija 8 — CRUD UI, rename i osnovni Undo

Status: završeno

Napravljeno:

- dodan `PATCH /entries/{entryId}` endpoint za preimenovanje
- rename koristi ista pravila validacije i rješavanja duplih naziva kao create
- Root mapa zaštićena je od preimenovanja
- izdvojen reusable backend validation rule za nazive
- implementiran floating New gumb s izbornikom za mapu i datoteku
- implementirana zajednička modal infrastruktura za create, rename i delete
- datoteka se stvara ručnim unosom punog naziva i ekstenzije
- akcije u retku prikazane su ikonama olovke i kante s tooltipovima i pristupačnim nazivima
- Delete confirmation jasno navodi 10-sekundni Undo rok
- implementiran globalni Undo toast s backend `expires_at` odbrojavanjem
- podržano je više istodobnih Undo toastova tijekom navigacije
- TanStack Query cache osvježava se nakon create, rename, delete i Undo mutacija
- dodane success, API i validation poruke
- uspješno prošla 42 backend testa sa 206 assertiona
- uspješno prošlo devet frontend integracijskih testova

Sljedeći korak:

> U Fazi 7 implementirati search UI, obnovu pending Undo toastova nakon refresha, list/grid postavke, ekstenzije i završno mapiranje ikona.

### Sesija 9 — datoteke u sidebar stablu

Status: završeno

Napravljeno:

- tree endpoint promijenjen u semantički precizniji `GET /entries/tree`
- endpoint vraća cijelu aktivnu hijerarhiju mapa i datoteka
- folder dobiva expand kontrolu kada sadrži mapu ili datoteku
- datoteke se prikazuju kao neklikabilni završni listovi stabla
- zadržana je navigacija klikom na mape
- dodan backend test ugniježđene datoteke u entry stablu
- dodan frontend test proširivanja mape koja sadrži datoteku
- uspješno prošla 42 backend testa sa 208 assertiona i 10 frontend testova

Sljedeći korak:

> Nastaviti Fazu 7 sa search UI-jem i obnovom pending Undo toastova nakon refresha.

### Sesija 10 — search UI i Undo nakon refresha

Status: završeno

Napravljeno:

- dodan search u sredinu headera s checkboxom `Search everywhere`
- placeholder se mijenja između `Search this folder` i `Searching everywhere`
- suggestions se dohvaćaju nakon 300 ms debouncea, uz otkazivanje zastarjelih requestova
- Enter pokreće exact pretragu punog naziva datoteke
- dropdown prikazuje najviše 10 rezultata s ikonom i breadcrumb putanjom
- Escape i klik izvan searcha zatvaraju rezultate
- klik rezultata otvara njegovu roditeljsku mapu i privremeno označava datoteku
- search koristi postojeći backend folder scope koji uključuje sve podmape
- pending deletion grupe dohvaćaju se pri pokretanju aplikacije
- aktivni Undo toastovi i mogućnost vraćanja sada preživljavaju refresh
- odbrojavanje koristi backend `server_time`, pa ne ovisi o satu korisnikova računala
- dodana tri integracijska testa za search scope, exact rezultat i Undo oporavak
- uspješno prošlo 13 frontend integracijskih testova

Sljedeći korak:

> Prije nastavka Faze 7 zajedno potvrditi detalje list/grid postavke, skrivanja ekstenzija i mapiranja ikona.

### Sesija 11 — prikazi, postavke i ikone

Status: završeno

Napravljeno:

- dodan list/grid toggle uz naslov trenutačne mape
- list ostaje zadani prikaz, a izbor se sprema u localStorage
- grid koristi iste podatke, navigaciju i reusable akcije kao list
- dodan Settings izbornik u header s postavkom `Show file extensions`
- postavka ekstenzija sprema se u localStorage i mijenja samo vizualni naziv
- skriva se samo posljednja ekstenzija, dok `.gitignore` i nazivi bez ekstenzije ostaju isti
- search, rename, API podaci i accessible nazivi uvijek zadržavaju puni naziv
- implementirana centralna `EntryIcon` komponenta za sve prikaze zapisa
- mapirane su ikone za dokumente, slike, audio, video, arhive, baze i česte programske tipove
- Word, Excel i PowerPoint imaju prepoznatljive `DOC`, `XLS` i `PPT` oznake u svojim bojama
- nepoznate ekstenzije koriste generičku document ikonu
- prazne i neprazne mape imaju različite ikone
- sidebar, search, list i grid koriste istu logiku naziva i ikona
- dodani integracijski i unit testovi za preference, nazive i ikone

Sljedeći korak:

> Zajedno pregledati završni UI polish i preostale testove prije Faze 8.

### Sesija 12 — robustnost, pristupačnost i čišćenje

Status: završeno

Napravljeno:

- modalima dodan focus trap, Escape zatvaranje i povrat fokusa na element koji ih je otvorio
- create/rename input i sigurni Cancel na Delete dijalogu dobili kontrolirani početni fokus
- New izbornik dobio ispravne menu semantike, početni fokus i Escape ponašanje
- Settings popover premješta fokus na postavku i vraća ga na zupčanik nakon Escapea
- modal naslovi i opisi koriste jedinstvene React ID-jeve
- dodan frontend test da Undo ostaje dostupan tijekom navigacije u drugu mapu
- dodan integracijski test keyboard fokusa, focus trapa i zatvaranja izbornika/dijaloga
- potvrđena race-condition zaštita kombinacijom parent-row locka i PostgreSQL UNIQUE indeksa
- dodan backend test koji potvrđuje case-insensitive jedinstvenost na razini baze
- pregledani su validacija, strukturirane API greške i HTTP statusi svih ruta
- uklonjeni su nekorišteni Laravel scaffold paketi `boost`, `pail` i `pao`
- potvrđeno je da Git ne prati tajne, runtime logove, dependency direktorije ni build output
- uspješno prošla 43 backend testa s 209 assertiona
- uspješno prošla 24 frontend testa

Sljedeći korak:

> Dovršiti Fazu 9: proširiti README arhitekturom i trade-offovima te napraviti završni Docker/end-to-end smoke test.

### Sesija 13 — README i završna provjera predaje

Status: završeno

Napravljeno:

- README je presložen tako da su potpune upute za pokretanje odmah na početku
- sažeto su dokumentirani testovi, funkcionalnosti, stack, arhitektura, model podataka, API i ograničenja
- aplikacija je podignuta iz čistog klona isključivo prema README-u
- provjereni su create, rekurzivni search, delete, Undo i trajno brisanje kroz stvarni API i queue worker
- potvrđeno je spremanje list/grid i extension postavki nakon refresha
- uklonjen je nepostojeći `tests/Unit` suite iz PHPUnit konfiguracije
- dodan je siguran testni environment kako čisti klon ne bi ovisio o lokalnom `.env` fileu
- prošli su Composer validation, Pint, frontend lint, build, 43 backend testa s 209 assertiona i 24 frontend testa
- potvrđeno je da repozitorij ne sadrži tajne, dependency direktorije ni generirane build artefakte

Sljedeći korak:

> Projekt je spreman za predaju; preostaje samo završni Git push nakon pregleda commita.

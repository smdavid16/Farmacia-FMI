# Documentație Proiect Tehnici Web: Farmacia FMI

„Farmacia FMI” este un magazin virtual, destinat comercializării online de medicamente fără rețetă (OTC), suplimente alimentare și produse de îngrijire personală (cosmetice).

## 1. Împărțirea informațiilor pe categorii și subcategorii

Pentru o navigare clară, produsele vor fi organizate într-un sistem arborescent, ușor de accesat de către utilizatori:

* **Medicamente (OTC)**: Subcategoriile includ Răceală și gripă, Dureri (analgezice), Alergii, Afecțiuni digestive.
* **Suplimente alimentare**: Subcategoriile includ Vitamine și minerale, Imunitate, Slăbire și detoxifiere, Sistemul nervos.
* **Cosmetice și Îngrijire personală**: Subcategoriile includ Îngrijirea feței, Îngrijirea corpului, Igienă orală, Îngrijirea părului.

## 2. Identificarea paginilor și a legăturilor dintre ele

Site-ul va fi structurat pe 5 pagini principale, interconectate prin meniul de navigație (Header):

* **Pagina Principală (Home):** Prezentarea ofertelor curente, scurtături către categoriile principale, secțiune cu „Top vânzări”.
* **Pagina de Produse (Catalog/Magazin):**Lista tuturor produselor, unde subcategoriile nu vor avea pagini complet separate, ci vor funcționa ca filtre dinamice în partea stângă (sidebar), permițând utilizatorului să filtreze produsele pe aceeași pagină.
* **Pagina Produsului (Detalii):** Titlu, preț, imagini, prospect (sau descriere detaliată), buton de „Adaugă în coș”.
* **Coșul de cumpărături & Checkout:** Sumarul comenzii, costul transportului, formularul de introducere a datelor pentru livrare și facturare.
* **Pagina Despre Noi & Contact:**  Informații fictive despre Farmacia FMI (viziune, echipă), formular de contact și o hartă.

**Fluxul utilizatorului (Legături logice):** Home -> Catalog Produse (folosind filtrele) -> Pagina Produsului -> Coș & Checkout.

## 3. Stabilirea cuvintelor și sintagmelor cheie

* **Generale (pentru întregul site):** farmacie online, Farmacia FMI, cumpără medicamente online, produse farmaceutice, suplimente alimentare, cosmetice online.
* **Pagina Principală:** oferte farmacie, medicamente la reducere, top suplimente, farmacie livrare rapidă.
* **Pagina de Produse (Catalog):** catalog medicamente, vitamine și minerale, tratament răceală, filtre produse farmaceutice.
* **Pagina Produsului:** prospect [Nume Produs], preț [Nume Produs], mod de administrare, indicații terapeutice, efecte adverse.
* **Coș/Checkout & Despre Noi/Contact:** comandă online medicamente, livrare farmacie, plată online securizată, contact Farmacia FMI, program farmacie, suport clienți farmacie online.

## 4. Analiza site-urilor similare

Pentru a proiecta o interfață cât mai eficientă, au fost analizate site-urile a 4 farmacii online reale din România:

### Farmacia Tei (farmaciatei.ro) 
* **Design/Organizare:** Meniu tip „mega-dropdown” foarte detaliat, listare masivă a produselor.
* **PRO:** Gamă imensă de produse foarte bine structurată în meniu; Afișarea clară a stocurilor.
* **CONTRA:** Designul este foarte aglomerat („cluttered”), obositor vizual pentru un utilizator nou; Funcția de căutare returnează adesea rezultate prea largi, lipsite de precizie.

### Dr. Max (drmax.ro)
* **Design/Organizare:** Aerisit, modern, axat pe vizual (spații albe generoase).
* **PRO:** Interfață (UI) excelentă, curată și modernă; Procesul de checkout este intuitiv, organizat pe pași clari.
* **CONTRA:** Timpul de încărcare (pageload) este uneori lent când se aplică mai multe filtre; Descrierile produselor sunt uneori prea succinte, ascunzând prospectul complet sub prea multe click-uri.

### Spring Farma (springfarma.com)
* **Design/Organizare:** Axat masiv pe marketing și promoții (bannere mari).
* **PRO:** Sistem atractiv de semnalizare a promoțiilor („Pachete 1+1”); Filtre foarte detaliate pentru suplimente alimentare (pe afecțiuni, ingrediente).
* **CONTRA:** Pe versiunea de mobil, header-ul și bannerele ocupă prea mult spațiu din ecran; Contrastul textului pe anumite butoane de acțiune nu respectă standardele de accesibilitate.

### Help Net (helpnet.ro)
* **Design/Organizare:** Elegant, culori branduite, se concentrează și pe conținut editorial.
* **PRO:** Integrarea articolelor de sănătate (blog) direct sub categoriile de produse; Pagina produsului este foarte bine structurată, cu tab-uri clare (Descriere / Mod de utilizare / Ingrediente).
* **CONTRA:** Navigarea în categoriile inferioare este ușor confuză; Procesul de creare a contului este prea stufos pentru o simplă comandă rapidă.

## 5. Paleta de Culori (Analogous RGB)

Proiectul folosește următoarele coduri de culoare:
* `#A0DB81` 
* `#81DBA6` 
* `#81DB87`
* `#C5DB81`
* `#81DBC4` 
* `#C907CA`

**Psihologia culorilor:**
În marketing, verdele este culoarea universal asociată cu sănătatea, vindecarea, vitalitatea și siguranța. Nuanțele deschise și pastelate alese (cum ar fi verdele mentă) au un efect vizual odihnitor, transmițând o stare de calm, curățenie și echilibru.

**Legătura cu tema site-ului:**
Deoarece tema site-ului este o farmacie, utilizarea acestor culori construiește din prima clipă un sentiment de încredere și profesionalism clinic, crucea verde fiind simbolul tradițional al farmaciilor. Această paletă „serioasă” și liniștitoare servește și unui scop stilistic secundar: creează un contrast intenționat și de efect cu abordarea satirică și umoristică a textelor de pe site, sporind impactul glumelor printr-o prezentare vizuală extrem de legitimă.
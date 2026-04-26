const express = require("express");
const path = require("path");
const fs = require("fs");
const sass = require("sass");
const sharp = require("sharp");
const pg = require("pg");

app = express();
app.set("view engine", "ejs");

let obGlobal = {
    obErori: null,
    obImagini: null,
    folderScss: path.join(__dirname, "resurse/scss"),
    folderCss: path.join(__dirname, "resurse/css"),
    folderBackup: path.join(__dirname, "backup"),
};

const caleScssVarInitial = path.join(obGlobal.folderScss, "_galerie_variabile.scss");
if (!fs.existsSync(caleScssVarInitial) || fs.readFileSync(caleScssVarInitial, 'utf8').trim() === "") {
    fs.writeFileSync(caleScssVarInitial, `$nr-imagini: 4;\n`);
}

function compileazaScss(caleScss, caleCss) {
    if (!caleCss) {
        let extensie = path.extname(caleScss); 
        let numeFaraExtensie = path.basename(caleScss, extensie); 
        // extragem doar numele fara extensie si adaugam .css
        caleCss = numeFaraExtensie + ".css";
    }

    if (!path.isAbsolute(caleScss))
        caleScss = path.join(obGlobal.folderScss, caleScss);
    if (!path.isAbsolute(caleCss))
        caleCss = path.join(obGlobal.folderCss, caleCss);

    let caleBackup = path.join(obGlobal.folderBackup, "resurse/css");
    if (!fs.existsSync(caleBackup)) {
        fs.mkdirSync(caleBackup, { recursive: true });
    }

    //TIMESTAMP IN BACKUP:
    if (fs.existsSync(caleCss)) {
        let numeFisCss = path.basename(caleCss); // ex: "galerie_animata.css"
        let extensie = path.extname(numeFisCss); // ex: ".css"
        let numeFaraExtensie = path.basename(numeFisCss, extensie); // ex: "galerie_animata"
        
        // Generam timestamp-ul curent in nr de ms
        let timestamp = Date.now(); 
        
        // noul nume: nume_timestamp.extensie
        let numeBackupCuTimestamp = `${numeFaraExtensie}_${timestamp}${extensie}`;
        
        fs.copyFileSync(caleCss, path.join(caleBackup, numeBackupCuTimestamp));
    }
    
    try {
        let rez = sass.compile(caleScss, { sourceMap: true });
        fs.writeFileSync(caleCss, rez.css);
    } catch(err) {
        console.error("Eroare la compilare SCSS:", err.message);
    }
}

// la pornirea serverului
if (fs.existsSync(obGlobal.folderScss)) {
    let vFisiere = fs.readdirSync(obGlobal.folderScss);
    for (let numeFis of vFisiere) {
        if (path.extname(numeFis) == ".scss") {
            compileazaScss(numeFis);
        }
    }

    fs.watch(obGlobal.folderScss, function (eveniment, numeFis) {
        if (eveniment == "change" || eveniment == "rename") {
            let caleCompleta = path.join(obGlobal.folderScss, numeFis);
            if (fs.existsSync(caleCompleta)) {
                compileazaScss(caleCompleta);
            }
        }
    });
}


function initImagini(){
    var continut= fs.readFileSync(path.join(__dirname,"resurse/json/galerie.json")).toString("utf-8");

    obGlobal.obImagini=JSON.parse(continut);
    let vImagini=obGlobal.obImagini.imagini;
    let caleGalerie=obGlobal.obImagini.cale_galerie

    let caleAbs=path.join(__dirname,caleGalerie);
    let caleAbsMediu=path.join(caleAbs, "mediu");
    if (!fs.existsSync(caleAbsMediu))
        fs.mkdirSync(caleAbsMediu);
    
    for (let imag of vImagini){
        [numeFis, ext]=imag.fisier.split("."); //"ceva.png" -> ["ceva", "png"]
        let caleFisAbs=path.join(caleAbs,imag.fisier);
        let caleFisMediuAbs=path.join(caleAbsMediu, numeFis+".webp");
        sharp(caleFisAbs).resize(300).toFile(caleFisMediuAbs);
        imag.fisier_mediu=path.join("/", caleGalerie, "mediu", numeFis+".webp" )
        imag.fisier=path.join("/", caleGalerie, imag.fisier )
        
    }
    // console.log(obGlobal.obImagini)
}
initImagini();

function initErori() {
    let caleJson = path.join(__dirname, "resurse/json/erori.json");

    // 1. Verificare existenta fișier
    if (!fs.existsSync(caleJson)) {
        console.error("Eroare: Fisierul erori.json nu exista!");
        process.exit(1);
    }

    let dateFisier = fs.readFileSync(caleJson, "utf8");

    // 2. Verificare proprietati duplicate (recursiv, toate nivelurile)
    function verificaDuplicate(text) {
        let index = 0;

        function skipWhitespace() {
            while (index < text.length && /\s/.test(text[index])) index++;
        }

        function parseazaString() {
            index++; // sare peste "
            let rezultat = '';
            while (index < text.length) {
                let c = text[index];
                if (c === '\\') { index += 2; continue; }
                if (c === '"') { index++; break; }
                rezultat += c;
                index++;
            }
            return rezultat;
        }

        function parseazaValoare() {
            skipWhitespace();
            let c = text[index];
            if (c === '{') return parseazaObiect();
            if (c === '[') return parseazaArray();
            if (c === '"') return parseazaString();
            if (c === 't') { index += 4; return true; }
            if (c === 'f') { index += 5; return false; }
            if (c === 'n') { index += 4; return null; }
            let start = index;
            while (index < text.length && /[0-9.\-eE+]/.test(text[index])) index++;
            return parseFloat(text.slice(start, index));
        }

        function parseazaObiect() {
            index++; // sari peste {
            let cheiGasite = [];
            skipWhitespace();

            while (text[index] !== '}') {
                skipWhitespace();
                let cheie = parseazaString();

                if (cheiGasite.includes(cheie)) {
                    console.error(`Eroare in JSON: Proprietatea "${cheie}" apare de mai multe ori!`);
                    process.exit(1);
                }
                cheiGasite.push(cheie);

                skipWhitespace();
                index++; // sari peste :
                parseazaValoare(); // recursie pentru valori imbricate
                skipWhitespace();
                if (text[index] === ',') index++;
                skipWhitespace();
            }
            index++; // sari peste }
        }

        function parseazaArray() {
            index++; // sari peste [
            skipWhitespace();
            while (text[index] !== ']') {
                parseazaValoare(); // recursie pentru elementele array-ului
                skipWhitespace();
                if (text[index] === ',') index++;
                skipWhitespace();
            }
            index++; // sari peste ]
        }

        parseazaValoare();
    }

    verificaDuplicate(dateFisier);

    // 3. Parsare JSON
    try {
        obGlobal.obErori = JSON.parse(dateFisier);
    } catch (err) {
        console.error("Eroare: JSON-ul erori.json este invalid (sintaxa gresita)!", err.message);
        process.exit(1);
    }

    // 4. Verificare existenta proprietati principale
    if (!obGlobal.obErori.info_erori || !obGlobal.obErori.cale_baza || !obGlobal.obErori.eroare_default) {
        console.error("Eroare: Fisierul JSON nu contine una dintre proprietatile obligatorii: info_erori, cale_baza, eroare_default.");
        process.exit(1);
    }

    // 5. Verificare existenta proprietati pentru eroare_default
    let errDef = obGlobal.obErori.eroare_default;
    if (!errDef.titlu || !errDef.text || !errDef.imagine) {
        console.error("Eroare: Obiectul eroare_default nu contine toate proprietatile obligatorii (titlu, text, imagine).");
        process.exit(1);
    }

    // 6. Verificare existenta folder specificat in cale_baza
    let caleBazaAbsoluta = path.join(__dirname, obGlobal.obErori.cale_baza);
    if (!fs.existsSync(caleBazaAbsoluta)) {
        console.error(`Eroare: Folderul specificat in cale_baza ("${obGlobal.obErori.cale_baza}") nu exista fizic pe server.`);
        process.exit(1);
    }

    // 7. Validare identificatori unici si afisare duplicate
    let identificatoriVazuti = {};
    for (let eroare of obGlobal.obErori.info_erori) {
        if (!identificatoriVazuti[eroare.identificator]) {
            identificatoriVazuti[eroare.identificator] = [];
        }
        identificatoriVazuti[eroare.identificator].push(eroare);
    }

    for (let id in identificatoriVazuti) {
        if (identificatoriVazuti[id].length > 1) {
            console.error(`Eroare: Identificatorul "${id}" este duplicat. Proprietatile erorilor cu acest ID sunt:`);
            identificatoriVazuti[id].forEach(errObj => {
                let errFaraId = { ...errObj };
                delete errFaraId.identificator;
                console.error(errFaraId);
            });
            process.exit(1);
        }
    }

    // 8. Verificarea existentei fisierelor imagine + adaugarea caii
    let caleImgDefault = path.join(caleBazaAbsoluta, errDef.imagine);
    if (!fs.existsSync(caleImgDefault)) {
        console.error(`Eroare: Imaginea pentru eroarea default ("${errDef.imagine}") nu exista`);
        process.exit(1);
    }
    obGlobal.obErori.eroare_default.imagine = path.posix.join(obGlobal.obErori.cale_baza, errDef.imagine);

    for (let eroare of obGlobal.obErori.info_erori) {
        let caleImgEroare = path.join(caleBazaAbsoluta, eroare.imagine);
        if (!fs.existsSync(caleImgEroare)) {
            console.error(`Eroare: Imaginea pentru eroarea ${eroare.identificator} ("${eroare.imagine}") nu exista in file system!`);
            process.exit(1);
        }
        eroare.imagine = path.posix.join(obGlobal.obErori.cale_baza, eroare.imagine);
    }
}

initErori();


function afisareEroare(res, identificator, titlu, text, imagine) {
    let eroareGasita = null;

    if (identificator && obGlobal.obErori && obGlobal.obErori.info_erori) {
        eroareGasita = obGlobal.obErori.info_erori.find(e => e.identificator === identificator);
    }

    if (!eroareGasita) {
        eroareGasita = obGlobal.obErori.eroare_default;
    }

    let titluFinal = titlu || eroareGasita.titlu;
    let textFinal = text || eroareGasita.text;
    let imagineFinala = imagine || eroareGasita.imagine;
    
    let codFinal = identificator || "Eroare";

    if (eroareGasita.status && typeof identificator === 'number') {
        res.status(identificator);
    }

    res.render("pagini/eroare", {
        titlu: titluFinal,
        text: textFinal,
        imagine: imagineFinala,
        cod: codFinal
    });
}

app.use(function(req, res, next) {
    if (req.path.endsWith(".ejs")) {
        return afisareEroare(res, 400);
    }
    next();
});

console.log("Folder index.js", __dirname);
console.log("Folder curent (de lucru)", process.cwd());
console.log("Cale fisier", __filename);

client=new pg.Client({
    database:"cti_2026",
    user:"david",
    password:"david",
    host:"localhost",
    port:5432
})

client.connect()




app.get("/cale", function(req, res){
    res.send("Raspuns la cererea <b style='color: red;'>GET</b> pe /cale");
    console.log("Am primit o cerere GET pe /cale");
});

app.get("/cale2", function(req, res){
    res.write("Raspuns la cererea GET pe /cale2\n");
    res.write("Raspuns2 la cererea GET pe /cale2");
    res.end();
    console.log("Am primit o cerere GET pe /cale2");
});

app.get(["/", "/index", "/home"], function(req, res){
    let adresaIp = req.ip;

    // 1. Calculam un numar aleatoriu N (putere a lui 2: 2, 4, 8, 16)
    const puteri = [2, 4, 8, 16];
    const nrImaginiAleator = puteri[Math.floor(Math.random() * puteri.length)];

    // 2. Selectam primele N imagini cu indice par din JSON
    let toateImaginile = obGlobal.obImagini.imagini;
    let imaginiPare = toateImaginile.filter((_, index) => index % 2 === 0);
    
    // Luam primele N imagini (daca exista destule în JSON)
    let selectatePentruGalerie = imaginiPare.slice(0, nrImaginiAleator);
    
    // Actualizam numarul real in caz ca in JSON sunt mai putine imagini decat N
    const nrFinal = selectatePentruGalerie.length;
    console.log(`Numar aleatoriu generat: ${nrImaginiAleator}. Imagini selectate pentru galerie: ${nrFinal}.`);
    // 3. Generam fisierul SASS de variabile pentru a acomoda numarul de imagini
    // Vom scrie in "_galerie_variabile.scss" care va fi importat in galerie_animata.scss
    const caleScssVar = path.join(obGlobal.folderScss, "_galerie_variabile.scss");
    try {
        fs.writeFileSync(caleScssVar, `$nr-imagini: ${nrFinal};\n`);
        
        // 4. Fortam compilarea fisierului principal al galeriei
        compileazaScss("galerie_animata.scss");
    } catch (err) {
        console.error("Eroare la scrierea/compilarea SASS dinamic:", err);
    }

    res.render("pagini/index", { 
        ipClient: adresaIp,
        imagini: obGlobal.obImagini.imagini,
        imaginiGalerieAnimata: selectatePentruGalerie
    });
    
    console.log("Am primit o cerere GET pe / de la IP:", adresaIp);
});

app.get("/despre", function(req, res){
    res.render("pagini/despre");
    console.log("Am primit o cerere GET pe /despre");
});

app.get("/produse", function(req, res){
    clauzaWhere = "";
    if (req.query.tip) {
        clauzaWhere = `where tip_produs='${req.query.tip}'`;
    }
    client.query(`select * from prajituri ${clauzaWhere}`, function(err, rez){
    if (err){
        console.error("Eroare la interogare", err);
        afisareEroare(res, 2);
    } else {
        res.render("pagini/produse", {
            produse: rez.rows,
            optiuni:[]
        });
        }
    })
});

app.get("/produs/:id", function(req, res){
    client.query(`select * from prajituri where id=${req.params.id}`, function(err, rez){
    if (err){
        console.error("Eroare la interogare", err);
        afisareEroare(res, 2);
    } else {
        if (rez.rowCount == 0) {
            afisareEroare(res, 404, "Produs inexistent");
        } else {
            res.render("pagini/produs", {
                prod: rez.rows[0],
            });
        }
    }
    })
});

app.use("/resurse", function(req, res, next) {
    let caleFizica = path.join(__dirname, "resurse", req.path);

    try {
        let stat = fs.statSync(caleFizica);
        if (stat.isDirectory()) {
            return afisareEroare(res, 403);
        }
    } catch (err) {
        // Ignoram eroarea aici si lasam express.static sau afisareEroare(404) sa se ocupe
    }
    next();
});

let vect_folder = ["temp", "logs", "backup", "fisiere_uploadate"];

for (let folder of vect_folder) {
    let caleFolder = path.join(__dirname, folder);
    if (!fs.existsSync(caleFolder)) {
        fs.mkdirSync(caleFolder);
    }
}

app.use("/resurse", express.static(path.join(__dirname, "resurse")));
app.use("/dist", express.static(path.join(__dirname, "/node_modules/bootstrap/dist")));


app.get("/favicon.ico", function(req, res){
    res.sendFile(path.join(__dirname, "/resurse/imagini/favicon/favicon.ico"));
    console.log("Am primit o cerere GET pe /favicon.ico");
});

app.get(/(.*)/, function(req, res) {
    let paginaCeruta = "pagini" + req.path;

    res.render(paginaCeruta, function(eroare, rezultatRandare) {
        if (eroare) {
            let codEroare = eroare.message.startsWith("Failed to lookup view") ? 404 : 500;
            afisareEroare(res, codEroare);
        } else {
            res.send(rezultatRandare);
        }
    });
});

app.get("/:a/:b", function(req, res){
    res.sendFile(path.join(__dirname, "index.html"));
    console.log(parseInt(req.params.a) + parseInt(req.params.b));
});

app.listen(8080, () => {
    console.log("Serverul a pornit!");
});
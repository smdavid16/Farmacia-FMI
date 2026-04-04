const express = require("express");
const path = require("path");
const fs = require("fs");
const sass = require("sass");

app = express();
app.set("view engine", "ejs");

let obGlobal = {
    obErori: null,
    obImagini: null,
    folderScss: path.join(__dirname, "resurse/scss"),
    folderCss: path.join(__dirname, "resurse/css"),
    folderBackup: path.join(__dirname, "backup"),
};

function compileazaScss(caleScss, caleCss) {
    if (!caleCss) {
        let numeFisExt = path.basename(caleScss);
        let numeFis = numeFisExt.split(".")[0];
        caleCss = numeFis + ".css";
    }

    if (!path.isAbsolute(caleScss))
        caleScss = path.join(obGlobal.folderScss, caleScss);
    if (!path.isAbsolute(caleCss))
        caleCss = path.join(obGlobal.folderCss, caleCss);

    let caleBackup = path.join(obGlobal.folderBackup, "resurse/css");
    if (!fs.existsSync(caleBackup)) {
        fs.mkdirSync(caleBackup, { recursive: true });
    }

    let numeFisCss = path.basename(caleCss);
    if (fs.existsSync(caleCss)) {
        fs.copyFileSync(caleCss, path.join(obGlobal.folderBackup, "resurse/css", numeFisCss));
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
            index++; // sari peste "
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

    // 8. Verificarea existentei fisierelor imagine + adaugarea căii
    let caleImgDefault = path.join(caleBazaAbsoluta, errDef.imagine);
    if (!fs.existsSync(caleImgDefault)) {
        console.error(`Eroare: Imaginea pentru eroarea default ("${errDef.imagine}") nu exista in file system!`);
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
    res.render("pagini/index", { ipClient: adresaIp });
    console.log("Am primit o cerere GET pe / de la IP:", adresaIp);
});

app.get("/despre", function(req, res){
    res.render("pagini/despre");
    console.log("Am primit o cerere GET pe /despre");
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
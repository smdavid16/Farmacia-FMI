const express= require("express");
const path= require("path");
const fs = require("fs");
const sass = require("sass");


app= express();
app.set("view engine", "ejs")


let obGlobal = {
    obErori: null,
    obImagini: null,
    folderScss: path.join(__dirname, "resurse/scss"),
    folderCss: path.join(__dirname, "resurse/css"),
    folderBackup: path.join(__dirname, "backup"),
};

function initErori() {
    try {
        let dateFisier = fs.readFileSync(path.join(__dirname, "resurse/json/erori.json"), "utf8");
        
        obGlobal.obErori = JSON.parse(dateFisier);

        let caleBaza = obGlobal.obErori.cale_baza;

        for (let eroare of obGlobal.obErori.info_erori) {
            eroare.imagine = caleBaza + eroare.imagine;
        }

        obGlobal.obErori.eroare_default.imagine = caleBaza + obGlobal.obErori.eroare_default.imagine;

    } catch (err) {
        console.error("nu s-a putut deschide erori.json", err);
    }
}

initErori();

function afisareEroare(res, identificator, titlu, text, imagine) {
    let eroareGasita = obGlobal.obErori.info_erori.find(e => e.identificator === identificator);

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
    console.log("Am primit o cerere GET pe /");
});



app.use("/resurse", function(req, res, next) {
    let caleFizica = path.join(__dirname, "resurse", req.path);

    try {
        let stat = fs.statSync(caleFizica);
        
        if (stat.isDirectory()) {
            return afisareEroare(res, 403);
        }
    } catch (err) {
    }

    next();
});


let vect_folder = ["temp", "logs", "backup", "fisiere_uploadate"]

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



app.listen(8080);
console.log("Serverul a pornit!");
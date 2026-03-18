const express= require("express");
const path= require("path");

app= express();
app.set("view engine", "ejs")

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
    res.render("pagini/index");
    console.log("Am primit o cerere GET pe /");
});

app.get("/despre", function(req, res){
    res.render("pagini/despre");
    console.log("Am primit o cerere GET pe /");
});

app.get("/:a/:b", function(req, res){
    res.sendFile(path.join(__dirname, "index.html"));
    console.log(parseInt(req.params.a) + parseInt(req.params.b));
});

app.use("/resurse", express.static(path.join(__dirname, "resurse")));

app.get(/(.*)/, function(req, res) {
    // req.path are numele paginii cautate, daca nu exista mai sus, se duce in call ul asta
    let paginaCeruta = "pagini/" + req.path;

    res.render(paginaCeruta, function(eroare, rezultatRandare) {
        if (eroare) {
            if (eroare.message.startsWith("Failed to lookup view")) {
                res.status(404).render("pagini/404"); 
            } else {
                res.status(500).render("pagini/eroare_generica"); 
            }
        } else {
            res.send(rezultatRandare);
        }
    });
});




app.listen(8080);
console.log("Serverul a pornit!");
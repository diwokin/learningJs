
var krasa = "blue";
function mirgo() {
    if( krasa == "blue" )
        krasa = "red";
    else
        krasa = "blue";
    document.getElementById("virsraksts").style.color = krasa;
}

function funkcija() {
    document.getElementById("virsraksts").innerHTML = "Eksāmens 2020";
    setInterval( mirgo, 1000 );
}

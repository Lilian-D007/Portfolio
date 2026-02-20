/* js/audio.js - Version avec Mémorisation */

document.addEventListener("DOMContentLoaded", function() {
    
    // 1. DÉTECTION DE LA PAGE ET DU MP3
    const path = window.location.pathname;
    const pageName = path.split("/").pop() || "index.html"; 

    const playlist = {
        "index.html":              "musique/index.mp3",
        "CV.html":                 "musique/CV.mp3",
        "Lettre-de-motivation.html": "musique/lettre-de-motivation.mp3",
        "contact.html":            "musique/contact.mp3",
        "projet-annee-1.html":     "musique/projet-annee-1.mp3",
        "projet-annee-2.html":     "musique/projet-annee-2.mp3",
        "tps-annee-1.html":        "musique/TP-annee-1.mp3",
        "tps-annee-2.html":        "musique/TP-annee-2.mp3",
        "tds-annee-1.html":        "musique/TD-annee-1.mp3",
        "tds-annee-2.html":        "musique/TD-annee-2.mp3",
        "veille1.html":            "musique/veille1.mp3",
        "veille2.html":            "musique/veille2.mp3"
    };

    if (!playlist[pageName]) return;

    // 2. RÉCUPÉRATION DES RÉGLAGES MÉMORISÉS
    // On regarde si l'utilisateur a déjà réglé le son auparavant
    let savedVol = localStorage.getItem("site_volume");
    let savedMute = localStorage.getItem("site_muted");

    // Valeurs par défaut si c'est la première visite
    if (savedVol === null) savedVol = 0.2;
    if (savedMute === null) savedMute = "false"; // Par défaut non muet

    // 3. CRÉATION DU WIDGET
    const widget = document.createElement("div");
    widget.className = "audio-widget";
    widget.innerHTML = `
        <button id="audio-btn" title="Activer/Couper le son">🔊</button>
        <input type="range" id="volume-slider" min="0" max="1" step="0.05" value="${savedVol}">
        <audio id="bg-music" loop>
            <source src="${playlist[pageName]}" type="audio/mpeg">
        </audio>
    `;
    document.body.appendChild(widget);

    // 4. LOGIQUE AUDIO
    const audio = document.getElementById("bg-music");
    const btn = document.getElementById("audio-btn");
    const slider = document.getElementById("volume-slider");

    // Appliquer les réglages sauvegardés
    audio.volume = parseFloat(savedVol);
    
    // Fonction de mise à jour visuelle du bouton
    function updateBtnState() {
        if (audio.muted) {
            btn.className = "muted"; // Blanc barré rouge
        } else {
            btn.className = ""; // Bleu actif
        }
    }

    // Gestion du démarrage
    if (savedMute === "true") {
        audio.muted = true;
        updateBtnState();
        // On lance quand même la lecture (mais silencieuse) pour que ça tourne
        audio.play().catch(() => {}); 
    } else {
        audio.muted = false;
        // Tentative d'autoplay avec son
        audio.play().then(() => {
            updateBtnState();
        }).catch(() => {
            // Si le navigateur bloque l'autoplay sonore, on passe en mute
            audio.muted = true;
            updateBtnState();
        });
    }

    // CLICK : Mute / Unmute + Sauvegarde
    btn.addEventListener("click", () => {
        audio.muted = !audio.muted;
        
        if (!audio.muted) audio.play(); // Relance si pause
        
        updateBtnState();
        localStorage.setItem("site_muted", audio.muted);
    });

    // SLIDER : Volume + Sauvegarde
    slider.addEventListener("input", (e) => {
        audio.volume = e.target.value;
        localStorage.setItem("site_volume", audio.volume);

        // Si on monte le son alors que c'est mute, on démute
        if(audio.muted && audio.volume > 0) {
            audio.muted = false;
            localStorage.setItem("site_muted", "false");
            updateBtnState();
        }
    });
});
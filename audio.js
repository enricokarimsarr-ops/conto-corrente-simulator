// =========================================================
// AUDIO ENGINE - COLONNA SONORA DIGITALE E EFFETTI DI BORSA
// =========================================================

let audioCtx = null;
let musicInterval = null;
let masterGain = null;

function initAudio() {
    if (audioCtx) return;
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    
    masterGain = audioCtx.createGain();
    masterGain.gain.setValueAtTime(0.18, audioCtx.currentTime); // Bilanciamento volume
    masterGain.connect(audioCtx.destination);
    
    startFinancialTickerMusic();
}

function startFinancialTickerMusic() {
    if (musicInterval) clearInterval(musicInterval);
    
    // Una sequenza arpeggiata stile trading cyberpunk (Do - Mi - Sol - Do)
    const marketMelody = [261.63, 329.63, 392.00, 523.25, 392.00, 329.63];
    let step = 0;

    musicInterval = setInterval(() => {
        if (!audioCtx || (typeof gameOver !== 'undefined' && gameOver)) return;
        try {
            let osc = audioCtx.createOscillator();
            let gainNode = audioCtx.createGain();
            
            osc.type = 'triangle';
            let currentFreq = marketMelody[step % marketMelody.length];
            
            // Meccanica Audio Reattiva: se rischi molto, la melodia sale di ottava diventando frenetica!
            if (typeof player !== 'undefined' && player.riskMultiplier >= 2.0) {
                currentFreq *= 1.5;
            }
            
            osc.frequency.setValueAtTime(currentFreq, audioCtx.currentTime);
            gainNode.gain.setValueAtTime(0.04, audioCtx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.14);
            
            osc.connect(gainNode); gainNode.connect(masterGain);
            osc.start(); osc.stop(audioCtx.currentTime + 0.14);
            step++;
        } catch(e) {}
    }, 180); // Ritmo costante da terminale finanziario
}

// EFFETTO 1: REGISTRATORE DI CASSA (Raccolta Stipendio)
function playCashSound() {
    if (!audioCtx) return;
    try {
        let now = audioCtx.currentTime;
        [880, 1320].forEach((freq, index) => {
            let osc = audioCtx.createOscillator();
            let gain = audioCtx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, now + index * 0.04);
            gain.gain.setValueAtTime(0.12, now + index * 0.04);
            gain.gain.exponentialRampToValueAtTime(0.001, now + index * 0.04 + 0.18);
            osc.connect(gain); gain.connect(masterGain);
            osc.start(now + index * 0.04); osc.stop(now + index * 0.04 + 0.18);
        });
    } catch(e) {}
}

// EFFETTO 2: ACQUISTO COMPULSIVO (Raccolta Sfizio)
function playLuxurySound() {
    if (!audioCtx) return;
    try {
        let osc = audioCtx.createOscillator();
        let gain = audioCtx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(350, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(950, audioCtx.currentTime + 0.25);
        gain.gain.setValueAtTime(0.06, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.25);
        osc.connect(gain); gain.connect(masterGain);
        osc.start(); osc.stop(audioCtx.currentTime + 0.25);
    } catch(e) {}
}

// EFFETTO 3: DEPOSITO IN BLINDATO (Cassaforte / Fondo)
function playSafeSound() {
    if (!audioCtx) return;
    try {
        let osc = audioCtx.createOscillator();
        let gain = audioCtx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(120, audioCtx.currentTime);
        osc.frequency.setValueAtTime(240, audioCtx.currentTime + 0.08);
        gain.gain.setValueAtTime(0.18, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.25);
        osc.connect(gain); gain.connect(masterGain);
        osc.start(); osc.stop(audioCtx.currentTime + 0.25);
    } catch(e) {}
}

// EFFETTO 4: ATTACCO INFORMATICO (Blocco da Phishing)
function playGlitchSound() {
    if (!audioCtx) return;
    try {
        let osc = audioCtx.createOscillator();
        let gain = audioCtx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(Math.random() * 600 + 200, audioCtx.currentTime);
        osc.frequency.linearRampToValueAtTime(60, audioCtx.currentTime + 0.35);
        gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.35);
        osc.connect(gain); gain.connect(masterGain);
        osc.start(); osc.stop(audioCtx.currentTime + 0.35);
    } catch(e) {}
}

// EFFETTO 5: SALDO DELLA SCADENZA (Pagamento Bolletta)
function playBillPaySound() {
    if (!audioCtx) return;
    try {
        let osc = audioCtx.createOscillator();
        let gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(550, audioCtx.currentTime);
        osc.frequency.setValueAtTime(750, audioCtx.currentTime + 0.06);
        gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.18);
        osc.connect(gain); gain.connect(masterGain);
        osc.start(); osc.stop(audioCtx.currentTime + 0.18);
    } catch(e) {}
}

// EFFETTO 6: DEPREZZAMENTO CRONICO (Contatto con l'Inflazione)
function playDrainSound() {
    if (!audioCtx || Math.random() > 0.12) return; // Evita rumore fastidioso continuo
    try {
        let osc = audioCtx.createOscillator();
        let gain = audioCtx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(80, audioCtx.currentTime);
        gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.06);
        osc.connect(gain); gain.connect(masterGain);
        osc.start(); osc.stop(audioCtx.currentTime + 0.06);
    } catch(e) {}
}

// EFFETTO 7: ALLARME INSOLVENZA (Scadenza Bolletta fallita)
function playAlarmSound() {
    if (!audioCtx) return;
    try {
        let osc = audioCtx.createOscillator();
        let gain = audioCtx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(160, audioCtx.currentTime);
        osc.frequency.linearRampToValueAtTime(320, audioCtx.currentTime + 0.25);
        gain.gain.setValueAtTime(0.18, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.28);
        osc.connect(gain); gain.connect(masterGain);
        osc.start(); osc.stop(audioCtx.currentTime + 0.28);
    } catch(e) {}
}

// EFFETTO 8: TRIMESTRE IN ATTIVO (Vittoria Livello)
function playWinSound() {
    if (!audioCtx) return;
    try {
        let now = audioCtx.currentTime;
        [523.25, 659.25, 783.99, 1046.50].forEach((freq, index) => {
            let osc = audioCtx.createOscillator();
            let gain = audioCtx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, now + index * 0.08);
            gain.gain.setValueAtTime(0.12, now + index * 0.08);
            gain.gain.exponentialRampToValueAtTime(0.001, now + index * 0.08 + 0.35);
            osc.connect(gain); gain.connect(masterGain);
            osc.start(now + index * 0.08); osc.stop(now + index * 0.08 + 0.35);
        });
    } catch(e) {}
}

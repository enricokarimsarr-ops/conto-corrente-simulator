const AudioManager = {
    ctx: null,

    // Inizializza l'AudioContext al primo input del giocatore
    init() {
        if (!this.ctx) {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    },

    // Funzione base per generare un suono retro
    playTone(frequency, type, duration, vol = 0.1) {
        if (!this.ctx) return;

        const osc = this.ctx.createOscillator();
        const gainNode = this.ctx.createGain();

        osc.type = type; // 'square', 'sawtooth', 'sine', 'triangle'
        osc.frequency.setValueAtTime(frequency, this.ctx.currentTime);
        
        // Dissolvenza per evitare "clic" audio brutti
        gainNode.gain.setValueAtTime(vol, this.ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);

        osc.connect(gainNode);
        gainNode.connect(this.ctx.destination);

        osc.start();
        osc.stop(this.ctx.currentTime + duration);
    },

    // Suono quando mangi i soldini (Bip corto e acuto)
    playCoin() {
        this.playTone(880, 'square', 0.1, 0.05); // Nota A5
    },

    // Suono quando prendi l'investimento (Arpeggio in salita)
    playInvestment() {
        if (!this.ctx) return;
        this.playTone(440, 'sine', 0.1, 0.1);
        setTimeout(() => this.playTone(554, 'sine', 0.1, 0.1), 100);
        setTimeout(() => this.playTone(659, 'sine', 0.2, 0.1), 200);
        setTimeout(() => this.playTone(880, 'sine', 0.4, 0.1), 300);
    },

    // Suono quando becchi una bolletta (Rumore basso e sgradevole)
    playBill() {
        this.playTone(150, 'sawtooth', 0.3, 0.2);
        setTimeout(() => this.playTone(100, 'sawtooth', 0.4, 0.2), 150);
    },

    // Suono di Bancarotta (Game Over)
    playGameOver() {
        if (!this.ctx) return;
        this.playTone(300, 'sawtooth', 0.5, 0.2);
        setTimeout(() => this.playTone(250, 'sawtooth', 0.5, 0.2), 400);
        setTimeout(() => this.playTone(200, 'sawtooth', 0.8, 0.2), 800);
    }
};

// Colleghiamo l'inizializzazione dell'audio alla pressione di un tasto
window.addEventListener('keydown', () => {
    AudioManager.init();
}, { once: true });

class Player {
    constructor() {
        this.speed = 3; // Deve dividere perfettamente TILE_SIZE (30)
        this.reset();
    }

    // Riporta il giocatore al centro (chiamato a inizio gioco o cambio livello)
    reset() {
        this.gridX = 7; // Riga 7, Colonna 7 su maps.js (lo '0')
        this.gridY = 7;
        this.x = this.gridX * TILE_SIZE;
        this.y = this.gridY * TILE_SIZE;
        
        // Direzione attuale (fermo all'inizio)
        this.dirX = 0;
        this.dirY = 0;
        
        // Buffer per la prossima mossa (permette di svoltare fluidamente prima dell'incrocio)
        this.nextDirX = 0;
        this.nextDirY = 0;

        this.radius = TILE_SIZE / 2 - 2; // Raggio del cerchio del salvadanaio
        this.angle = 0.2; // Per l'animazione della bocca stile Pac-Man
        this.mouthSpeed = 0.02;
    }

    // Ascolta i tasti premuti e imposta la PROSSIMA direzione desiderata
    handleInput(key) {
        switch (key) {
            case "ArrowUp":
                this.nextDirX = 0; this.nextDirY = -1;
                break;
            case "ArrowDown":
                this.nextDirX = 0; this.nextDirY = 1;
                break;
            case "ArrowLeft":
                this.nextDirX = -1; this.nextDirY = 0;
                break;
            case "ArrowRight":
                this.nextDirX = 1; this.nextDirY = 0;
                break;
        }
    }

    // Controlla se la cella d'arrivo è un muro (1)
    isWall(nextGridX, nextGridY, currentMap) {
        // Controllo out of bounds di sicurezza
        if (nextGridY < 0 || nextGridY >= GRID_ROWS || nextGridX < 0 || nextGridX >= GRID_COLS) {
            return true;
        }
        return currentMap[nextGridY][nextGridX] === 1;
    }

    // Aggiornamento della logica di movimento
    update(currentMap) {
        // SIAMO ALLINEATI ALLA GRIGLIA?
        // Controlliamo se il movimento pixel è perfettamente sopra una cella
        if (this.x % TILE_SIZE === 0 && this.y % TILE_SIZE === 0) {
            this.gridX = this.x / TILE_SIZE;
            this.gridY = this.y / TILE_SIZE;

            // 1. Prova a girare nella direzione prenotata dal giocatore (nextDir)
            if (!this.isWall(this.gridX + this.nextDirX, this.gridY + this.nextDirY, currentMap)) {
                this.dirX = this.nextDirX;
                this.dirY = this.nextDirY;
            }
            
            // 2. Se anche la direzione attuale sbatte contro un muro, fermati
            if (this.isWall(this.gridX + this.dirX, this.gridY + this.dirY, currentMap)) {
                this.dirX = 0;
                this.dirY = 0;
            }
        }

        // Muovi effettivamente il player pixel per pixel
        this.x += this.dirX * this.speed;
        this.y += this.dirY * this.speed;

        // Animazione minimale della bocca se si sta muovendo
        if (this.dirX !== 0 || this.dirY !== 0) {
            this.angle += this.mouthSpeed;
            if (this.angle > 0.4 || this.angle < 0.05) {
                this.mouthSpeed = -this.mouthSpeed;
            }
        }
    }

    // Disegna il player sul Canvas (Un cerchio giallo/oro stile moneta con la bocca)
    draw(ctx) {
        ctx.save();
        // Trasla la matrice al centro del player per gestire la rotazione della bocca
        ctx.translate(this.x + TILE_SIZE / 2, this.y + TILE_SIZE / 2);
        
        // Ruota la faccia in base alla direzione di movimento
        let rotation = 0;
        if (this.dirX === 1) rotation = 0;
        if (this.dirX === -1) rotation = Math.PI;
        if (this.dirY === 1) rotation = Math.PI / 2;
        if (this.dirY === -1) rotation = -Math.PI / 2;
        ctx.rotate(rotation);

        // Disegna il corpo (Moneta/Salvadanaio)
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, this.angle * Math.PI, (2 - this.angle) * Math.PI);
        ctx.lineTo(0, 0);
        ctx.fillStyle = "#f1c40f"; // Oro/Giallo monetina
        ctx.fill();
        ctx.closePath();

        // Disegna l'occhio
        ctx.beginPath();
        ctx.arc(2, -8, 2.5, 0, 2 * Math.PI);
        ctx.fillStyle = "#000000";
        ctx.fill();
        ctx.closePath();

        ctx.restore();
    }
}

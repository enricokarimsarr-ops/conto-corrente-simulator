class Ghost {
    constructor(gridX, gridY, color) {
        this.speed = 2; // Leggermente più lento del player per darti una chance
        this.color = color || "#ff3333"; // Rosso inflazione di default
        this.gridX = gridX;
        this.gridY = gridY;
        this.x = this.gridX * TILE_SIZE;
        this.y = this.gridY * TILE_SIZE;
        
        this.dirX = 1;
        this.dirY = 0;
    }

    // Reset posizione del fantasmino
    reset(gridX, gridY) {
        this.gridX = gridX;
        this.gridY = gridY;
        this.x = this.gridX * TILE_SIZE;
        this.y = this.gridY * TILE_SIZE;
        this.dirX = 1;
        this.dirY = 0;
    }

    isWall(nextGridX, nextGridY, currentMap) {
        if (nextGridY < 0 || nextGridY >= GRID_ROWS || nextGridX < 0 || nextGridX >= GRID_COLS) {
            return true;
        }
        return currentMap[nextGridY][nextGridX] === 1;
    }

    update(currentMap) {
        // Quando è perfettamente allineato alla griglia, sceglie una direzione
        if (this.x % TILE_SIZE === 0 && this.y % TILE_SIZE === 0) {
            this.gridX = this.x / TILE_SIZE;
            this.gridY = this.y / TILE_SIZE;

            // Trova tutte le direzioni possibili agli incroci
            const dirs = [
                {x: 1, y: 0}, {x: -1, y: 0},
                {x: 0, y: 1}, {x: 0, y: -1}
            ];
            
            const validDirs = dirs.filter(d => !this.isWall(this.gridX + d.x, this.gridY + d.y, currentMap));

            // Evita di tornare indietro se possibile, rendendo il movimento più fluido
            if (validDirs.length > 1) {
                const backtrackX = -this.dirX;
                const backtrackY = -this.dirY;
                const choices = validDirs.filter(d => !(d.x === backtrackX && d.y === backtrackY));
                if (choices.length > 0) {
                    const chosen = choices[Math.floor(Math.random() * choices.length)];
                    this.dirX = chosen.x;
                    this.dirY = chosen.y;
                } else {
                    const chosen = validDirs[Math.floor(Math.random() * validDirs.length)];
                    this.dirX = chosen.x;
                    this.dirY = chosen.y;
                }
            } else if (validDirs.length === 1) {
                this.dirX = validDirs[0].x;
                this.dirY = validDirs[0].y;
            }
        }

        this.x += this.dirX * this.speed;
        this.y += this.dirY * this.speed;
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x + TILE_SIZE / 2, this.y + TILE_SIZE / 2);

        // Corpo del Fantasmino (Inflazione)
        ctx.beginPath();
        ctx.arc(0, -2, TILE_SIZE / 2 - 2, Math.PI, 0, false);
        // Piedi a zig-zag
        ctx.lineTo(TILE_SIZE / 2 - 2, TILE_SIZE / 2 - 2);
        ctx.lineTo(TILE_SIZE / 4, TILE_SIZE / 4);
        ctx.lineTo(0, TILE_SIZE / 2 - 2);
        ctx.lineTo(-TILE_SIZE / 4, TILE_SIZE / 4);
        ctx.lineTo(-(TILE_SIZE / 2 - 2), TILE_SIZE / 2 - 2);
        
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.closePath();

        // Occhietti bianchi
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(-4, -4, 3, 0, Math.PI * 2);
        ctx.arc(4, -4, 3, 0, Math.PI * 2);
        ctx.fill();

        // Pupille nere che guardano a destra/sinistra a seconda della direzione
        ctx.fillStyle = "#000000";
        ctx.beginPath();
        ctx.arc(-4 + this.dirX, -4 + this.dirY, 1.5, 0, Math.PI * 2);
        ctx.arc(4 + this.dirX, -4 + this.dirY, 1.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }
}

// Oggetto che contiene tutte le funzioni di disegno per gli elementi della mappa
const Sprites = {
    
    // 1. I Muri (Stile "Banca di massima sicurezza" con bordi al neon)
    drawWall(ctx, x, y, size) {
        ctx.fillStyle = "#1e2746"; // Sfondo del muro
        ctx.fillRect(x, y, size, size);
        ctx.strokeStyle = "#34447c"; // Bordo
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, size, size);
    },

    // 2. I Soldi / Risparmi (Piccoli pallini verdi/oro)
    drawCoin(ctx, x, y, size) {
        ctx.beginPath();
        ctx.arc(x + size / 2, y + size / 2, 3, 0, Math.PI * 2);
        ctx.fillStyle = "#4cd137";
        ctx.fill();
        ctx.closePath();
    },

    // 3. Gli Investimenti (Un diamante o rombo dorato che pulsa)
    drawInvestment(ctx, x, y, size, time) {
        const pulse = Math.sin(time / 150) * 2; // Effetto pulsante
        
        ctx.save();
        ctx.translate(x + size / 2, y + size / 2);
        ctx.rotate(Math.PI / 4); // Ruota di 45 gradi per fare un rombo
        
        ctx.fillStyle = "#f1c40f";
        ctx.shadowBlur = 10;
        ctx.shadowColor = "#f1c40f"; // Effetto bagliore
        ctx.fillRect(-6 - pulse, -6 - pulse, 12 + pulse * 2, 12 + pulse * 2);
        
        ctx.restore();
    },

    // 4. Le Bollette (La "Ciliegia" rossa e minacciosa)
    drawBill(ctx, x, y, size) {
        ctx.save();
        ctx.translate(x + size / 2, y + size / 2);
        
        // Disegna l'avviso rosso (quadrato smussato o cerchio)
        ctx.beginPath();
        ctx.arc(0, 0, 7, 0, Math.PI * 2);
        ctx.fillStyle = "#e84118"; // Rosso allarme
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = "#ffffff";
        ctx.stroke();
        ctx.closePath();

        // Simbolo del meno (spesa)
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(-4, -1, 8, 2);

        ctx.restore();
    },

    // Funzione principale che legge la matrice e disegna tutto
    drawMap(ctx, currentMap, time) {
        for (let row = 0; row < GRID_ROWS; row++) {
            for (let col = 0; col < GRID_COLS; col++) {
                let tileId = currentMap[row][col];
                let x = col * TILE_SIZE;
                let y = row * TILE_SIZE;

                if (tileId === 1) this.drawWall(ctx, x, y, TILE_SIZE);
                else if (tileId === 2) this.drawCoin(ctx, x, y, TILE_SIZE);
                else if (tileId === 3) this.drawInvestment(ctx, x, y, TILE_SIZE, time);
                else if (tileId === 4) this.drawBill(ctx, x, y, TILE_SIZE);
            }
        }
    }
};

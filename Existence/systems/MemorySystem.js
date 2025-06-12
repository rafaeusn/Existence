// systems/MemorySystem.js
export default class MemorySystem {
    constructor(scene, camera, renderer) {
        this.scene = scene;
        this.camera = camera;
        this.renderer = renderer;
        this.score = 0;
        this.badMemories = 0;
        this.gameDuration = 60 * 1000; // 1 minuto
        this.memoryInterval = 800; // tempo entre memórias
        this.memoryLifetime = 1500; // tempo de vida da memória
        this.gameOver = false;
        this.memories = [];
        this.memorySpawner = null;
        this.gameTimer = null;
        
        // Texto para mostrar score
        this.createScoreDisplay();
    }

    createScoreDisplay() {
        const scoreDiv = document.createElement('div');
        scoreDiv.id = 'game-ui';
        scoreDiv.style.position = 'absolute';
        scoreDiv.style.top = '20px';
        scoreDiv.style.left = '20px';
        scoreDiv.style.color = 'white';
        scoreDiv.style.fontFamily = 'Arial';
        scoreDiv.style.fontSize = '24px';
        scoreDiv.style.zIndex = '10';
        scoreDiv.innerHTML = `Memórias Boas: ${this.score} | Ruins: ${this.badMemories}`;
        document.body.appendChild(scoreDiv);
    }

    updateScoreDisplay() {
        const scoreDiv = document.getElementById('game-ui');
        if (scoreDiv) {
            scoreDiv.innerHTML = `Memórias Boas: ${this.score} | Ruins: ${this.badMemories}`;
        }
    }

    spawnMemory() {
        if (this.gameOver) return;

        // Cria um plano 2D (sprite) para a memória
        const textureLoader = new THREE.TextureLoader();
        const isGood = Math.random() > 0.3;
        const texture = textureLoader.load(isGood ? 'assets/memorygood.png' : 'assets/memorybad.png');
        
        const material = new THREE.SpriteMaterial({ 
            map: texture,
            transparent: true
        });
        
        const memory = new THREE.Sprite(material);
        memory.scale.set(1, 1, 1);
        
        // Posição aleatória na tela (em coordenadas do mundo 3D)
        const x = (Math.random() - 0.5) * 20;
        const y = (Math.random() - 0.5) * 10;
        memory.position.set(x, y, -5);
        
        this.scene.add(memory);
        
        // Configura timeout para remoção
        const timeout = setTimeout(() => {
            this.scene.remove(memory);
            this.memories = this.memories.filter(m => m !== memory);
        }, this.memoryLifetime);

        // Armazena referência para interação
        this.memories.push({
            object: memory,
            isGood,
            timeout
        });
    }

    checkIntersection(pointer) {
        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(pointer, this.camera);
        
        const intersects = raycaster.intersectObjects(
            this.memories.map(m => m.object)
        );
        
        if (intersects.length > 0) {
            const memoryObj = this.memories.find(
                m => m.object === intersects[0].object
            );
            
            this.handleMemoryClick(memoryObj);
        }
    }

    handleMemoryClick(memory) {
        clearTimeout(memory.timeout);
        this.scene.remove(memory.object);
        this.memories = this.memories.filter(m => m !== memory);
        
        if (memory.isGood) {
            this.score++;
        } else {
            this.badMemories++;
        }
        
        this.updateScoreDisplay();
        this.checkGameState();
    }

    checkGameState() {
        if (this.badMemories >= 3) {
            this.endGame("Você clicou em 3 memórias ruins. Game Over.");
        } else if (this.score >= 30) {
            this.endGame("Você coletou 30 memórias boas. Vitória!");
        }
    }

    endGame(message) {
        this.gameOver = true;
        clearInterval(this.memorySpawner);
        clearTimeout(this.gameTimer);
        
        // Mostra mensagem de fim de jogo
        const gameOverDiv = document.createElement('div');
        gameOverDiv.style.position = 'absolute';
        gameOverDiv.style.top = '50%';
        gameOverDiv.style.left = '50%';
        gameOverDiv.style.transform = 'translate(-50%, -50%)';
        gameOverDiv.style.color = 'white';
        gameOverDiv.style.fontSize = '32px';
        gameOverDiv.style.zIndex = '10';
        gameOverDiv.style.backgroundColor = 'rgba(0,0,0,0.7)';
        gameOverDiv.style.padding = '20px';
        gameOverDiv.style.borderRadius = '10px';
        gameOverDiv.textContent = message;
        document.body.appendChild(gameOverDiv);
        
        // Botão de reinício
        const restartBtn = document.createElement('button');
        restartBtn.textContent = 'Jogar Novamente';
        restartBtn.style.marginTop = '20px';
        restartBtn.style.padding = '10px 20px';
        gameOverDiv.appendChild(restartBtn);
        
        restartBtn.addEventListener('click', () => {
            document.body.removeChild(gameOverDiv);
            this.resetGame();
        });
    }

    resetGame() {
        // Limpa memórias existentes
        this.memories.forEach(memory => {
            clearTimeout(memory.timeout);
            this.scene.remove(memory.object);
        });
        
        this.memories = [];
        this.score = 0;
        this.badMemories = 0;
        this.gameOver = false;
        this.updateScoreDisplay();
        
        // Reinicia o jogo
        this.startGame();
    }

    startGame() {
        // Inicia spawn de memórias
        this.memorySpawner = setInterval(() => {
            if (!this.gameOver) this.spawnMemory();
        }, this.memoryInterval);
        
        // Configura tempo de jogo
        this.gameTimer = setTimeout(() => {
            if (!this.gameOver) this.endGame("Tempo esgotado!");
        }, this.gameDuration);
    }
}
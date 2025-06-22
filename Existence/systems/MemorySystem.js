import * as THREE from 'https://cdn.skypack.dev/three@0.136.0';
export default class MemorySystem {
    constructor(scene, camera, renderer, composer) {
        this.scene = scene;
        this.camera = camera;
        this.renderer = renderer;
        this.composer = composer;
        this.score = 0;
        this.badMemories = 0;
        this.memoryInterval = 900;
        this.memoryLifetime = 1500;
        this.gameOver = false;
        this.memories = [];
        this.pointer = new THREE.Vector2();
    }

    createScoreDisplay() {
        if (this.scoreDisplay) this.scoreDisplay.remove();
        this.scoreDisplay = document.createElement('div');
        this.scoreDisplay.id = 'game-ui';
        this.scoreDisplay.classList.add('score-display');
        this.updateScoreDisplay();
        document.body.appendChild(this.scoreDisplay);
    }

    createProgressBar() {
        document.querySelector('.progress-container')?.remove();
        document.querySelectorAll('.progress-icon').forEach(icon => icon.remove());
        this.progressContainer = document.createElement('div');
        this.progressContainer.classList.add('progress-container');
        this.progressBar = document.createElement('div');
        this.progressBar.classList.add('progress-bar');
        this.progressContainer.appendChild(this.progressBar);
        const divisions = [0.25, 0.5, 0.75, 1];
        divisions.forEach(factor => {
            const line = document.createElement('div');
            line.classList.add('progress-line');
            line.style.top = `${(1 - factor) * 100}%`;
            this.progressContainer.appendChild(line);
        });
        const imgPaths = ['./assets/sprite_3.png', './assets/sprite_2.png', './assets/sprite_1.png', './assets/sprite_0.png'];
        imgPaths.forEach((src, index) => {
            const img = document.createElement('img');
            img.src = src;
            img.classList.add('progress-icon');
            img.style.top = `${(1 - divisions[index]) * 300 + 45}px`;
            document.body.appendChild(img);
        });
        document.body.appendChild(this.progressContainer);
    }

    updateScoreDisplay() {
        if (this.scoreDisplay) {
            this.scoreDisplay.innerHTML = `Memórias Boas: ${this.score} | Ruins: ${this.badMemories}`;
        }
    }

    updateProgressBar() {
        if (this.gameOver) return;
        this.progressValue = Math.max(0, Math.min(100, this.progressValue));
        this.progressBar.style.height = `${this.progressValue}%`;
        
        if (this.progressValue >= 100) {
            const winMessage = "A luz retorna, não como uma explosão, mas como o nascer de um sol sereno. Você juntou os fragmentos, não para reconstruir o passado, mas para iluminar o presente.<br><br>Você entendeu. Não viemos ao mundo destinados a um único propósito. Não precisamos nos pressionar com o fardo da existência a cada momento. A vida não é uma resposta a ser encontrada, mas um caminho a ser criado.<br><br>Ao abraçar os altos e baixos, você encontrou o seu próprio equilíbrio. A sua própria paz. Você é o seu próprio destino.";
            this.endGame(winMessage, true);
        }

        if (this.progressValue <= 0) {
            const gameOverMessage = "O eco silenciou. As memórias, antes estrelas cintilantes, tornaram-se apenas poeira fria no vazio. A chama, que um dia ardeu com a promessa de um amanhã, foi sufocada pelo peso do agora.<br><br>Você se esvaiu na solidão, imergindo numa escuridão que já não tem fim nem começo. Não há mais luta, apenas o silêncio profundo de uma pergunta que nunca encontrará resposta.<br><br>Você perdeu a esperança...";
            this.endGame(gameOverMessage, false);
        }
    }

    spawnMemory() {
        if (this.gameOver) return;
        const isGood = Math.random() > 0.3;
        const texturePath = isGood ? './assets/memorygood.png' : './assets/memorybad.png';
        const textureLoader = new THREE.TextureLoader();
        textureLoader.load(texturePath, (texture) => {
            const material = new THREE.SpriteMaterial({
                map: texture,
                transparent: true,
                opacity: 0.9,
                depthTest: false,
                color: 0xcccccc, 
                blending: THREE.AdditiveBlending 
            });
            const memory = new THREE.Sprite(material);
            memory.scale.set(50, 50, 1);
            const z = -5;
            const viewport = this.getViewportSizeAtZ(z);
            const marginFactor = 0.9;
            memory.position.set((Math.random() - 0.5) * viewport.width * marginFactor, (Math.random() - 0.5) * viewport.height * marginFactor, z);
            this.scene.add(memory);
            this.animateMemoryAppear(memory);
            const timeout = setTimeout(() => this.removeMemory({ object: memory }), this.memoryLifetime);
            this.memories.push({ object: memory, isGood, timeout });
        });
    }

    collectMemory(memory) {
        clearTimeout(memory.timeout);
        
        if (memory.isGood) {
            // --- VOLUME AJUSTADO ---
            const goodSound = new Audio('./assets/goodsound.mp3');
            goodSound.volume = 0.1; // Volume mais baixo (0.0 a 1.0)
            goodSound.play();
            
            this.score++;
            this.progressValue += 6;
            this.animateGoodMemoryCollection(memory.object);
        } else {
            // --- VOLUME AJUSTADO ---
            const badSound = new Audio('./assets/badsound.mp3');
            badSound.volume = 0.1; // Volume mais baixo (0.0 a 1.0)
            badSound.play();

            this.badMemories++;
            this.progressValue -= 10;
            this.animateBadMemoryCollection(memory.object);
        }
        
        this.memories = this.memories.filter(m => m !== memory);
        this.updateScoreDisplay();
        this.updateProgressBar();
    }

    animateGoodMemoryCollection(memoryObject) {
        const initialOpacity = memoryObject.material.opacity;
        const flashDuration = 250; 
        const startTime = Date.now();
        const animate = () => {
            const elapsedTime = Date.now() - startTime;
            if (elapsedTime > flashDuration || !memoryObject.parent) {
                if (memoryObject.parent) this.scene.remove(memoryObject);
                return;
            }
            const progress = elapsedTime / flashDuration;
            memoryObject.material.opacity = initialOpacity * (1 - progress); 
            memoryObject.scale.x += 0.2; 
            memoryObject.scale.y += 0.2;
            requestAnimationFrame(animate);
        };
        animate();
    }

    animateBadMemoryCollection(memoryObject) {
        let flashes = 0;
        const flashInterval = setInterval(() => {
            if (!memoryObject.parent) {
                clearInterval(flashInterval);
                return;
            }
            memoryObject.material.color.set(flashes % 2 === 0 ? 0xff0000 : 0xcccccc);
            flashes++;
            if (flashes >= 4) {
                clearInterval(flashInterval);
                if (memoryObject.parent) this.removeMemory({ object: memoryObject });
            }
        }, 100);
    }

    startMemoryGame() { if (this.memorySpawner) clearInterval(this.memorySpawner); if (this.progressDrainInterval) clearInterval(this.progressDrainInterval); this.memories.forEach(memory => { clearTimeout(memory.timeout); if (memory.object.parent) this.scene.remove(memory.object); }); this.memories = []; this.score = 0; this.badMemories = 0; this.progressValue = 50; this.gameOver = false; this.createScoreDisplay(); this.createProgressBar(); this.updateScoreDisplay(); this.updateProgressBar(); this.spawnMemory(); this.memorySpawner = setInterval(() => { if (!this.gameOver) this.spawnMemory(); }, this.memoryInterval); this.progressDrainInterval = setInterval(() => { if (!this.gameOver) { this.progressValue -= 0.6; this.updateProgressBar(); } }, 200); }
    endGame(message, isWin) { if (this.gameOver) return; this.gameOver = true; clearInterval(this.memorySpawner); clearInterval(this.progressDrainInterval); this.scoreDisplay?.remove(); this.progressContainer?.remove(); document.querySelectorAll('.progress-icon').forEach(icon => icon.remove()); this.memories.forEach(memory => { clearTimeout(memory.timeout); if (memory.object.parent) this.scene.remove(memory.object); }); this.memories = []; const targetScene = isWin ? 'hopeWinGame' : 'hopeDepressed'; const event = new CustomEvent('changeScene', { detail: { sceneName: targetScene, message: message, score: this.score } }); window.dispatchEvent(event); }
    onPointerClick(event) { this.pointer.x = (event.clientX / window.innerWidth) * 2 - 1; this.pointer.y = -(event.clientY / window.innerHeight) * 2 + 1; this.checkMemoryIntersection(); }
    checkMemoryIntersection() { if (this.gameOver) return; const raycaster = new THREE.Raycaster(); raycaster.setFromCamera(this.pointer, this.camera); const intersects = raycaster.intersectObjects(this.memories.map(m => m.object)); if (intersects.length > 0) { const memory = this.memories.find(m => m.object === intersects[0].object); if (memory) this.collectMemory(memory); } }
    animateMemoryAppear(memory) { const scaleUp = { x: 1.5, y: 1.5 }; const targetScale = { x: 3.0, y: 3.0 }; const animate = () => { if (!memory.parent) return; scaleUp.x += (targetScale.x - scaleUp.x) * 0.2; scaleUp.y += (targetScale.y - scaleUp.y) * 0.2; memory.scale.set(scaleUp.x, scaleUp.y, 1); if (Math.abs(scaleUp.x - targetScale.x) > 0.01) requestAnimationFrame(animate); }; animate(); }
    removeMemory(memoryObj) { if (!memoryObj || !memoryObj.object?.parent) return; if (memoryObj.timeout) clearTimeout(memoryObj.timeout); const fadeOut = () => { if (!memoryObj.object?.parent) return; memoryObj.object.material.opacity -= 0.05; if (memoryObj.object.material.opacity > 0) { requestAnimationFrame(fadeOut); } else { this.scene.remove(memoryObj.object); this.memories = this.memories.filter(m => m !== memoryObj); } }; fadeOut(); }
    getViewportSizeAtZ(z) { const fov = this.camera.fov * (Math.PI / 180); const height = 2 * Math.tan(fov / 2) * Math.abs(z - this.camera.position.z); const width = height * this.camera.aspect; return { width, height }; }
}

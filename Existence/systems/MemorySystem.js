import * as THREE from 'https://cdn.skypack.dev/three@0.136.0';
// MemorySystem não precisa mais de importar o button-manager.

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
        this.glow = 5.5;
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
        if (this.progressValue >= 100) this.endGame("Você preencheu a barra de boas memórias. Vitória!", true);
        if (this.progressValue >= 75) { new Audio('./assets/choirsound.wav').play(); this.glow = 10.5; }
        if (this.progressValue <= 0) this.endGame("Sua alma se esvaiu.", false);
    }

    collectMemory(memory) {
        clearTimeout(memory.timeout);
        const expandAndFade = () => {
            if (!memory.object?.parent) return;
            memory.object.scale.x += 0.1;
            memory.object.scale.y += 0.1;
            memory.object.material.opacity -= 0.05;
            if (memory.object.material.opacity > 0) { requestAnimationFrame(expandAndFade); } 
            else { this.scene.remove(memory.object); this.memories = this.memories.filter(m => m !== memory); }
        };
        expandAndFade();
        if (memory.isGood) {
            new Audio('./assets/goodsound.mp3').play();
            this.score++;
            this.progressValue += 10;
            if(this.composer.passes[2]) this.composer.passes[2].strength = 1.5;
            setTimeout(() => { if(this.composer.passes[2]) this.composer.passes[2].strength = 1.35; }, 300);
        } else {
            new Audio('./assets/badsound.mp3').play();
            this.badMemories++;
            this.progressValue -= 5;
            if(this.composer.passes[1]) this.composer.passes[1].uniforms['damp'].value = 0.7;
            setTimeout(() => { if(this.composer.passes[1]) this.composer.passes[1].uniforms['damp'].value = 0.85; }, 500);
        }
        this.updateScoreDisplay();
        this.updateProgressBar();
    }

    startMemoryGame() {
        if (this.memorySpawner) clearInterval(this.memorySpawner);
        if (this.progressDrainInterval) clearInterval(this.progressDrainInterval);
        this.memories.forEach(memory => { clearTimeout(memory.timeout); if (memory.object.parent) this.scene.remove(memory.object); });
        this.memories = [];
        this.score = 0;
        this.badMemories = 0;
        this.progressValue = 50;
        this.gameOver = false;
        this.createScoreDisplay();
        this.createProgressBar();
        this.updateScoreDisplay();
        this.updateProgressBar();
        this.spawnMemory();
        this.memorySpawner = setInterval(() => { if (!this.gameOver) this.spawnMemory(); }, this.memoryInterval);
        this.progressDrainInterval = setInterval(() => { if (!this.gameOver) { this.progressValue -= 0.6; this.updateProgressBar(); } }, 200);
    }
    
    endGame(message, isWin) {
        if (this.gameOver) return;
        this.gameOver = true;
        clearInterval(this.memorySpawner);
        clearInterval(this.progressDrainInterval);
        this.scoreDisplay?.remove();
        this.progressContainer?.remove();
        document.querySelectorAll('.progress-icon').forEach(icon => icon.remove());
        this.memories.forEach(memory => { clearTimeout(memory.timeout); if (memory.object.parent) this.scene.remove(memory.object); });
        this.memories = [];

        // Determina qual cena carregar com base na vitória ou derrota
        const targetScene = isWin ? 'hopeWinGame' : 'hopeDepressed';
        
        // Dispara um único evento com todos os dados necessários
        const event = new CustomEvent('changeScene', { 
            detail: { 
                sceneName: targetScene,
                message: message,
                score: this.score 
            } 
        });
        window.dispatchEvent(event);
    }

    // Funções de utilidade
    onPointerClick(event) { this.pointer.x = (event.clientX / window.innerWidth) * 2 - 1; this.pointer.y = -(event.clientY / window.innerHeight) * 2 + 1; this.checkMemoryIntersection(); }
    checkMemoryIntersection() { if (this.gameOver) return; const raycaster = new THREE.Raycaster(); raycaster.setFromCamera(this.pointer, this.camera); const intersects = raycaster.intersectObjects(this.memories.map(m => m.object)); if (intersects.length > 0) { const memory = this.memories.find(m => m.object === intersects[0].object); if (memory) this.collectMemory(memory); } }
    spawnMemory() { if (this.gameOver) return; const isGood = Math.random() > 0.3; const texturePath = isGood ? './assets/memorygood.png' : './assets/memorybad.png'; const textureLoader = new THREE.TextureLoader(); textureLoader.load(texturePath, (texture) => { const material = new THREE.SpriteMaterial({ map: texture, transparent: true, opacity: 0.9, depthTest: false }); const memory = new THREE.Sprite(material); memory.scale.set(50, 50, 1); const z = -5; const viewport = this.getViewportSizeAtZ(z); const marginFactor = 0.9; memory.position.set((Math.random() - 0.5) * viewport.width * marginFactor, (Math.random() - 0.5) * viewport.height * marginFactor, z); this.scene.add(memory); this.animateMemoryAppear(memory); const timeout = setTimeout(() => this.removeMemory({ object: memory }), this.memoryLifetime); this.memories.push({ object: memory, isGood, timeout }); }); }
    animateMemoryAppear(memory) { const scaleUp = { x: 1.5, y: 1.5 }; const targetScale = { x: 3.0, y: 3.0 }; const animate = () => { if (!memory.parent) return; scaleUp.x += (targetScale.x - scaleUp.x) * 0.2; scaleUp.y += (targetScale.y - scaleUp.y) * 0.2; memory.scale.set(scaleUp.x, scaleUp.y, 1); if (Math.abs(scaleUp.x - targetScale.x) > 0.01) requestAnimationFrame(animate); }; animate(); }
    removeMemory(memoryObj) { if (!memoryObj || !memoryObj.object?.parent) return; if (memoryObj.timeout) clearTimeout(memoryObj.timeout); const fadeOut = () => { if (!memoryObj.object?.parent) return; memoryObj.object.material.opacity -= 0.05; if (memoryObj.object.material.opacity > 0) { requestAnimationFrame(fadeOut); } else { this.scene.remove(memoryObj.object); this.memories = this.memories.filter(m => m !== memoryObj); } }; fadeOut(); }
    getViewportSizeAtZ(z) { const fov = this.camera.fov * (Math.PI / 180); const height = 2 * Math.tan(fov / 2) * Math.abs(z - this.camera.position.z); const width = height * this.camera.aspect; return { width, height }; }
}

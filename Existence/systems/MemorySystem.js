// systems/MemorySystem.js

import * as THREE from 'https://cdn.skypack.dev/three@0.136.0';



export default class MemorySystem {
    constructor(scene, camera, renderer, composer) {
        this.scene = scene;
        this.camera = camera;
        this.renderer = renderer;
        this.composer = composer;
        this.score = 0;
        this.badMemories = 0;
        this.gameDuration = 60 * 1000; // 1 minuto
        this.memoryInterval = 800; // tempo entre memórias
        this.memoryLifetime = 1500; // tempo de vida da memória
        this.gameOver = false;
        this.memories = [];
        this.memorySpawner = null;
        this.gameTimer = null;
        this.pointer = new THREE.Vector2();
        this.glow = 5.5; // Intensidade do glow


        

        
        // Texto para mostrar score
        this.createScoreDisplay();

        this.createProgressBar();
        this.progressValue = 50; // Começa no meio (50%)
        this.updateProgressBar();

    }
  createScoreDisplay() {
    if (this.scoreDisplay) {
      document.body.removeChild(this.scoreDisplay);
    }
    
    this.scoreDisplay = document.createElement('div');
    this.scoreDisplay.id = 'game-ui';
    this.scoreDisplay.style.position = 'absolute';
    this.scoreDisplay.style.top = '20px';
    this.scoreDisplay.style.left = '20px';
    this.scoreDisplay.style.color = 'white';
    this.scoreDisplay.style.fontFamily = 'Arial';
    this.scoreDisplay.style.fontSize = '24px';
    this.scoreDisplay.style.zIndex = '10';
    this.scoreDisplay.style.textShadow = '0 0 5px rgba(0,0,0,0.5)';
    this.scoreDisplay.style.pointerEvents = 'none';
    this.updateScoreDisplay();
    document.body.appendChild(this.scoreDisplay);
  }

createProgressBar() {
  this.progressContainer = document.createElement('div');
  this.progressContainer.style.position = 'absolute';
  this.progressContainer.style.right = '20px';
  this.progressContainer.style.top = '20px';
  this.progressContainer.style.width = '20px';
  this.progressContainer.style.height = '300px';
  this.progressContainer.style.background = 'rgba(255,255,255,0.1)';
  this.progressContainer.style.border = '2px solid #ccc';
  this.progressContainer.style.borderRadius = '5px';
  this.progressContainer.style.overflow = 'hidden';
  this.progressContainer.style.zIndex = '10';
  this.progressContainer.style.position = 'absolute';

  // Barra de progresso
  this.progressBar = document.createElement('div');
  this.progressBar.style.width = '100%';
  this.progressBar.style.height = '50%'; // Começa no meio
  this.progressBar.style.background = 'linear-gradient(to top,rgb(255, 255, 255),rgb(0, 0, 0))';
  this.progressBar.style.transition = 'height 0.2s ease';
  this.progressContainer.appendChild(this.progressBar);

  // Divisões na barra
  const divisions = [0.25, 0.5, 0.75, 1];
  divisions.forEach(factor => {
    const line = document.createElement('div');
    line.style.position = 'absolute';
    line.style.top = `${(1 - factor) * 100}%`;
    line.style.left = '0';
    line.style.width = '100%';
    line.style.height = '2px';
    line.style.background = 'rgba(255,255,255,0.5)';
    this.progressContainer.appendChild(line);
  });

  // Imagens ao lado
  const imgPaths = [
    './assets/sprite_3.png',
    './assets/sprite_2.png',
    './assets/sprite_1.png',
    './assets/sprite_0.png'
  ];
  imgPaths.forEach((src, index) => {
    const img = document.createElement('img');
    img.src = src;
    img.style.position = 'absolute';
    img.style.right = '60px';
    img.style.width = '32px';
    img.style.height = '32px';
    img.style.top = `${(1 - divisions[index]) * 300 + 45}px`; // centraliza a imagem no marcador
    img.style.zIndex = '11';
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
  // Limita o valor entre 0 e 100
  this.progressValue = Math.max(0, Math.min(100, this.progressValue));

  // Atualiza altura da barrinha
  this.progressBar.style.height = `${this.progressValue}%`;

  // Se chegar a 100% — vitória
  if (this.progressValue >= 100) {
    this.endGame("Você preencheu a barra de boas memórias. Vitória!");
  }

  if( this.progressValue >= 75) {
    let choirSound = new Audio('./assets/choirsound.wav');
    choirSound.volume = 0.08; // Ajusta o volume do som
    choirSound.play();
    this.glow = 10.5; // Aumenta o glow quando a barra está acima de 75%
  }



  // Se chegar a 0% — derrota
  if (this.progressValue <= 0) {
    this.endGame("Sua barra esvaziou. Game Over.");
  }
}


  onPointerClick(event) {
    this.pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
    this.pointer.y = - (event.clientY / window.innerHeight) * 2 + 1;
    this.checkMemoryIntersection();
  }

  checkMemoryIntersection() {
    if (this.gameOver) return;
    
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(this.pointer, this.camera);
    
    const intersects = raycaster.intersectObjects(
      this.memories.map(m => m.object)
    );
    
    if (intersects.length > 0) {
      const memory = this.memories.find(
        m => m.object === intersects[0].object
      );
      this.collectMemory(memory);
    }
  }

spawnMemory() {
  if (this.gameOver) return;

  const isGood = Math.random() > 0.3;
  const texturePath = isGood ? 
    './assets/memorygood.png' : 
    './assets/memorybad.png';

  // DEBUG: Mostra o caminho real no console
  console.log("Carregando textura:", texturePath);

  const textureLoader = new THREE.TextureLoader();
  textureLoader.load(texturePath, (texture) => {
    const material = new THREE.SpriteMaterial({ 
      map: texture,
      transparent: true, // DEVE estar ativado!
      opacity: 0.9,
      depthTest: false // Adicione isto
    });
    
    const memory = new THREE.Sprite(material);

    // DEBUG: Verifica se a textura carregou
    console.log("Textura carregada:", texture);
    
    // Apenas uma definição de escala!
    memory.scale.set(50, 50, 1);
    
    // Posição melhorada
    const z = -5;
    const viewport = this.getViewportSizeAtZ(z);

    // Reduzir 10% das bordas para evitar que metade da imagem fique fora
    const marginFactor = 0.9;

    memory.position.set(
      (Math.random() - 0.5) * viewport.width * marginFactor,
      (Math.random() - 0.5) * viewport.height * marginFactor,
      z
    );


    this.scene.add(memory);
    this.animateMemoryAppear(memory);

    const timeout = setTimeout(() => {
      this.removeMemory({ object: memory });
    }, this.memoryLifetime);

    this.memories.push({
      object: memory,
      isGood,
      texturePath, // Armazene o caminho aqui se precisar
      timeout
    });
  }, undefined, (error) => {
    console.error('Erro ao carregar textura:', error);
  });
}

  animateMemoryAppear(memory) {

    const scaleUp = { x: 1.5, y: 1.5 };
    const targetScale = { x: 3.0, y: 3.0 };
    
    const animate = () => {
      scaleUp.x += (targetScale.x - scaleUp.x) * 0.2;
      scaleUp.y += (targetScale.y - scaleUp.y) * 0.2;
      memory.scale.set(scaleUp.x, scaleUp.y, 1);
      
      if (Math.abs(scaleUp.x - targetScale.x) > 0.01) {
        requestAnimationFrame(animate);
      }
    };
    animate();
  }

removeMemory(memoryObj) {
  // Verificação mais completa
  if (!memoryObj || !memoryObj.object || !memoryObj.object.parent) {
    return;
  }
  
  // Limpa o timeout se existir
  if (memoryObj.timeout) {
    clearTimeout(memoryObj.timeout);
  }

  // Animação de fade out
  const fadeOut = () => {
    if (!memoryObj.object.parent) return;
    
    memoryObj.object.material.opacity -= 0.05;
    if (memoryObj.object.material.opacity > 0) {
      requestAnimationFrame(fadeOut);
    } else {
      this.scene.remove(memoryObj.object);
      this.memories = this.memories.filter(m => m !== memoryObj);
    }
  };
  
  fadeOut();
}

  collectMemory(memory) {
    clearTimeout(memory.timeout);
    
    // Animação de coleta
    const expandAndFade = () => {
      memory.object.scale.x += 0.1;
      memory.object.scale.y += 0.1;
      memory.object.material.opacity -= 0.05;
      
      if (memory.object.material.opacity > 0) {
        requestAnimationFrame(expandAndFade);
      } else {
        this.scene.remove(memory.object);
        this.memories = this.memories.filter(m => m !== memory);
      }
    };
    expandAndFade();
    
    // Atualiza pontuação
    if (memory.isGood) {
      let goodSound = new Audio('./assets/goodsound.mp3');
      goodSound.volume = 0.2; // Ajusta o volume do som
      goodSound.play();
      this.score++;
      this.progressValue += 10; // Memória boa faz a barra subir 10%

      this.composer.passes[2].strength = 1.5;
      setTimeout(() => {
        this.composer.passes[2].strength = 1.35;
      }, 300);
    } else {
      let badSound = new Audio('./assets/badsound.mp3');
      badSound.volume = 0.2; // Ajusta o volume do som
      badSound.play();
      this.badMemories++;
      this.progressValue -= 5; // Memória ruim faz a barra cair 5%
      this.composer.passes[1].uniforms['damp'].value = 0.7;
      setTimeout(() => {
        this.composer.passes[1].uniforms['damp'].value = 0.85;
      }, 500);
    }

    this.updateScoreDisplay();
    this.updateProgressBar();

  }


  // Método para obter o tamanho da viewport em uma determinada profundidade Z
  getViewportSizeAtZ(z) {
    const fov = this.camera.fov * (Math.PI / 180);
    const height = 2 * Math.tan(fov / 2) * Math.abs(z - this.camera.position.z);
    const width = height * this.camera.aspect;
    return { width, height };
  }



  startMemoryGame() {
    // Limpa memórias existentes
    this.memories.forEach(memory => {
      clearTimeout(memory.timeout);
      this.scene.remove(memory.object);
    });
    this.memories = [];
    
    // Reseta estado do jogo
    this.score = 0;
    this.badMemories = 0;
    this.gameOver = false;
    this.updateScoreDisplay();
    this.progressValue = 50;
    this.updateProgressBar();

if (this.gameOverDisplay && document.body.contains(this.gameOverDisplay)) {
  document.body.removeChild(this.gameOverDisplay);
  this.gameOverDisplay = null;
}

  

    
    // Inicia spawn de memórias
    this.memorySpawner = setInterval(() => {
      if (!this.gameOver) this.spawnMemory();
    }, this.memoryInterval);
    

    // Drena a barra ao longo do tempo
    this.progressDrainInterval = setInterval(() => {
      if (!this.gameOver) {
        this.progressValue -= .6; // valor a cada ciclo — ajusta a dificuldade aqui
        this.updateProgressBar();
      }
    }, 200); // a cada 200ms — você pode ajustar esse tempo também
  }

  endGame(message) {
    this.gameOver = true;
    clearInterval(this.memorySpawner);
    clearTimeout(this.gameTimer);
    clearInterval(this.progressDrainInterval);

    
    // Remove todas as memórias
    this.memories.forEach(memory => {
      clearTimeout(memory.timeout);
      this.scene.remove(memory.object);
    });
    this.memories = [];
    
    // Mostra mensagem de fim de jogo
if (this.gameOverDisplay && document.body.contains(this.gameOverDisplay)) {
  document.body.removeChild(this.gameOverDisplay);
  this.gameOverDisplay = null;
}

    
    this.gameOverDisplay = document.createElement('div');
    this.gameOverDisplay.style.position = 'absolute';
    this.gameOverDisplay.style.top = '50%';
    this.gameOverDisplay.style.left = '50%';
    this.gameOverDisplay.style.transform = 'translate(-50%, -50%)';
    this.gameOverDisplay.style.color = 'white';
    this.gameOverDisplay.style.fontSize = '32px';
    this.gameOverDisplay.style.zIndex = '10';
    this.gameOverDisplay.style.backgroundColor = 'rgba(17, 21, 28, 0.9)';
    this.gameOverDisplay.style.padding = '30px';
    this.gameOverDisplay.style.borderRadius = '15px';
    this.gameOverDisplay.style.textAlign = 'center';
    this.gameOverDisplay.style.boxShadow = '0 0 20px rgba(255,255,255,0.2)';
    this.gameOverDisplay.innerHTML = `
      <p style="margin:0 0 20px 0">${message}</p>
      <p style="font-size:24px;margin:0 0 20px 0">Memórias boas: ${this.score}</p>
      <button id="restartButton" style="
        background: #3a506b;
        color: white;
        border: none;
        padding: 12px 25px;
        font-size: 18px;
        border-radius: 5px;
        cursor: pointer;
        transition: background 0.3s;
      ">Jogar Novamente</button>
    `;
    document.body.appendChild(this.gameOverDisplay);
    
    document.getElementById('restartButton').addEventListener('click', () => {
      document.body.removeChild(this.gameOverDisplay);
      this.startMemoryGame();
    });
  }
   
}
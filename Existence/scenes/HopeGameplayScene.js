import * as THREE from 'https://cdn.skypack.dev/three@0.136.0';
import { RGBELoader } from 'https://cdn.skypack.dev/three@0.136.0/examples/jsm/loaders/RGBELoader.js';
import { EffectComposer } from 'https://cdn.skypack.dev/three@0.136.0/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'https://cdn.skypack.dev/three@0.136.0/examples/jsm/postprocessing/RenderPass.js';
import { AfterimagePass } from 'https://cdn.skypack.dev/three@0.136.0/examples/jsm/postprocessing/AfterimagePass.js';
import { UnrealBloomPass } from 'https://cdn.skypack.dev/three@0.136.0/examples/jsm/postprocessing/UnrealBloomPass.js';
import { FBXLoader } from 'https://cdn.skypack.dev/three@0.136.0/examples/jsm/loaders/FBXLoader.js';


export default class HopeGameplay {
  constructor(canvasId = 'canvas') {
    this.canvas = document.getElementById(canvasId);
    this.renderer = new THREE.WebGLRenderer({ 
      canvas: this.canvas, 
      antialias: true,
      alpha: true
    });
    this.clock = new THREE.Clock();
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 0.1, 1000);

    // Modelos e animações
    this.bodyMixer = null;
    this.eyesMixer = null;
    this.theta = 0;
    this.scale = 0.03;

    // Pós-processamento
    this.composer = null;

    // Sistema de memórias
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

    // Elementos UI
    this.scoreDisplay = null;
    this.gameOverDisplay = null;
  }

  async init() {
    // Configuração do renderizador
    this.renderer.setClearColor(0x11151c, 0); // Fundo transparente para o menu
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(window.innerWidth, window.innerHeight);

    // Posição da câmera
    this.camera.position.set(0, 40, 20);

    // Carrega ambiente
    await this.loadEnvironment();

    // Configura materiais
    this.setupMaterials();

    // Carrega modelos
    await this.loadModels();

    // Configura névoa
    this.setupFog();

    // Configura pós-processamento
    this.setupPostProcessing();

    // Event listeners
    window.addEventListener('resize', this.onWindowResize.bind(this));
    this.canvas.addEventListener('click', (event) => this.onPointerClick(event), false);

    // Inicia UI e jogo
    this.createScoreDisplay();


    // Inicia animação
    this.animate();
    this.startMemoryGame();
  }

  async loadEnvironment() {
    return new Promise((resolve) => {
      const loader = new RGBELoader();
      loader.load('https://miroleon.github.io/daily-assets/gradient.hdr', (hdrEquirect) => {
        hdrEquirect.mapping = THREE.EquirectangularReflectionMapping;
        this.scene.environment = hdrEquirect;
        this.hdrEquirect = hdrEquirect;
        resolve();
      });
    });
  }

  setupMaterials() {
    this.blobMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      roughness: 0.3,
      metalness: 0,
      envMap: this.hdrEquirect,
      envMapIntensity: 0.5,
    });

    this.uniMaterial = new THREE.MeshPhysicalMaterial({
      envMap: this.hdrEquirect,
      envMapIntensity: 0,
      emissive: 0x11151c,
    });
  }

  async loadModels() {
    const loader = new FBXLoader();

    // Carrega corpo
    this.body = await loader.loadAsync('https://miroleon.github.io/daily-assets/body_03.fbx');
    this.bodyMixer = new THREE.AnimationMixer(this.body);
    const bodyAction = this.bodyMixer.clipAction(this.body.animations[0]);
    bodyAction.play();

    this.body.traverse((child) => {
      if (child.isMesh) child.material = this.blobMaterial;
    });
    this.body.position.set(0, -5, 0);
    this.body.scale.setScalar(this.scale);
    this.scene.add(this.body);

    // Carrega olhos
    this.eyes = await loader.loadAsync('https://miroleon.github.io/daily-assets/eyes_03.fbx');
    this.eyesMixer = new THREE.AnimationMixer(this.eyes);
    const eyesAction = this.eyesMixer.clipAction(this.eyes.animations[0]);
    eyesAction.play();

    this.eyes.traverse((child) => {
      if (child.isMesh) child.material = this.uniMaterial;
    });
    this.eyes.position.set(0, -5, 0);
    this.eyes.scale.setScalar(this.scale);
    this.scene.add(this.eyes);
  }

  setupFog() {
    this.scene.fog = new THREE.FogExp2(0x11151c, 0.015);
  }

  setupPostProcessing() {
    const renderScene = new RenderPass(this.scene, this.camera);
    const afterimagePass = new AfterimagePass();
    afterimagePass.uniforms['damp'].value = 0.85;

    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),
      1.35, // strength
      0.1,  // threshold
      1     // radius
    );

    this.composer = new EffectComposer(this.renderer);
    this.composer.addPass(renderScene);
    this.composer.addPass(afterimagePass);
    this.composer.addPass(bloomPass);
  }

  /* SISTEMA DE MEMÓRIAS */
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

  updateScoreDisplay() {
    if (this.scoreDisplay) {
      this.scoreDisplay.innerHTML = `Memórias Boas: ${this.score} | Ruins: ${this.badMemories}`;
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
    memory.position.set(
      (Math.random() - 0.5) * 8, // -4 a 4
      (Math.random() - 0.5) * 8, // -4 a 4
      -5 // IMPORTANTE: coloca na frente da cena
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
      this.score++;
      this.composer.passes[2].strength = 1.5;
      setTimeout(() => {
        this.composer.passes[2].strength = 1.35;
      }, 300);
    } else {
      this.badMemories++;
      this.composer.passes[1].uniforms['damp'].value = 0.7;
      setTimeout(() => {
        this.composer.passes[1].uniforms['damp'].value = 0.85;
      }, 500);
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
    
    // Inicia spawn de memórias
    this.memorySpawner = setInterval(() => {
      if (!this.gameOver) this.spawnMemory();
    }, this.memoryInterval);
    
    // Configura tempo de jogo
    this.gameTimer = setTimeout(() => {
      if (!this.gameOver) this.endGame("Tempo esgotado!");
    }, this.gameDuration);
  }

  endGame(message) {
    this.gameOver = true;
    clearInterval(this.memorySpawner);
    clearTimeout(this.gameTimer);
    
    // Remove todas as memórias
    this.memories.forEach(memory => {
      clearTimeout(memory.timeout);
      this.scene.remove(memory.object);
    });
    this.memories = [];
    
    // Mostra mensagem de fim de jogo
    if (this.gameOverDisplay) {
      document.body.removeChild(this.gameOverDisplay);
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

  /* ANIMAÇÃO E RENDERIZAÇÃO */
  update() {
    this.theta += 0.005;
    this.camera.position.x = -Math.sin(this.theta + 1) * 45;
    this.camera.position.z = -Math.cos(this.theta + 1) * 45;
    this.camera.position.y = 20 * Math.cos(this.theta + 1) + 20;
    this.camera.lookAt(0, 5, 0);
  }

  onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.composer.setSize(window.innerWidth, window.innerHeight);
  }

  animate() {
    requestAnimationFrame(this.animate.bind(this));

    const delta = this.clock.getDelta();
    
    // Atualiza animações
    if (this.bodyMixer) this.bodyMixer.update(delta / 2);
    if (this.eyesMixer) this.eyesMixer.update(delta / 2);
    
    // Atualiza cena
    this.update();
    
    this.render();
  }
  render(){
    // Renderiza
 this.renderer.render(this.scene, this.camera);

  }
}
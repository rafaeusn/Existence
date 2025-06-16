import * as THREE from 'https://cdn.skypack.dev/three@0.136.0';
import { RGBELoader } from 'https://cdn.skypack.dev/three@0.136.0/examples/jsm/loaders/RGBELoader.js';
import { EffectComposer } from 'https://cdn.skypack.dev/three@0.136.0/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'https://cdn.skypack.dev/three@0.136.0/examples/jsm/postprocessing/RenderPass.js';
import { AfterimagePass } from 'https://cdn.skypack.dev/three@0.136.0/examples/jsm/postprocessing/AfterimagePass.js';
import { UnrealBloomPass } from 'https://cdn.skypack.dev/three@0.136.0/examples/jsm/postprocessing/UnrealBloomPass.js';
import { FBXLoader } from 'https://cdn.skypack.dev/three@0.136.0/examples/jsm/loaders/FBXLoader.js';
import MemorySystem from '../systems/MemorySystem.js';

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


    // Inicia UI e jogo
    this.memorySystem = new MemorySystem(this.scene, this.camera, this.renderer, this.composer);

    this.memorySystem.createScoreDisplay();

    
    // Event listeners
    window.addEventListener('resize', this.onWindowResize.bind(this));
    window.addEventListener('click', (event) => this.memorySystem.onPointerClick(event));


    // Inicia animação
    this.animate();
    this.memorySystem.startMemoryGame();
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
      envMapIntensity: 2.5,
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
import * as THREE from 'https://cdn.skypack.dev/three@0.136.0';
import { RGBELoader } from 'https://cdn.skypack.dev/three@0.136.0/examples/jsm/loaders/RGBELoader.js';
import { EffectComposer } from 'https://cdn.skypack.dev/three@0.136.0/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'https://cdn.skypack.dev/three@0.136.0/examples/jsm/postprocessing/RenderPass.js';
import { AfterimagePass } from 'https://cdn.skypack.dev/three@0.136.0/examples/jsm/postprocessing/AfterimagePass.js';
import { UnrealBloomPass } from 'https://cdn.skypack.dev/three@0.136.0/examples/jsm/postprocessing/UnrealBloomPass.js';
import { FBXLoader } from 'https://cdn.skypack.dev/three@0.136.0/examples/jsm/loaders/FBXLoader.js';
import MemorySystem from '../systems/MemorySystem.js';

export default class HopeGameplayScene {
    constructor(renderer) {
        this.renderer = renderer;
        this.scene = new THREE.Scene();
        // --- ESTILO RESTAURADO: Câmera com FOV de 45 ---
        this.camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.clock = new THREE.Clock();
        
        this.theta = 0; // Renomeado de theta1 para consistência
        this.composer = null;
        this.memorySystem = null;
        
        this.resizeListener = this.onWindowResize.bind(this);
        this.clickListener = (event) => {
            if (this.memorySystem) this.memorySystem.onPointerClick(event);
        };
    }

    async init() {
        // --- ESTILO RESTAURADO: Fundo, Câmera e HDR ---
        this.renderer.setClearColor(0x000000, 1);
        this.camera.position.set(0, 40, 20); // Posição inicial correta

        const hdrEquirect = await new RGBELoader().loadAsync('https://miroleon.github.io/daily-assets/gradient_4_comp.hdr');
        hdrEquirect.mapping = THREE.EquirectangularReflectionMapping;
        this.scene.environment = hdrEquirect;
        
        // --- ESTILO RESTAURADO: Materiais ---
        const blobMaterial = new THREE.MeshPhysicalMaterial({
            color: 0xffffff,
            roughness: 0.3,
            metalness: 0,
            envMap: hdrEquirect,
            envMapIntensity: 0.5,
        });
        const uniMaterial = new THREE.MeshPhysicalMaterial({
            envMap: hdrEquirect,
            envMapIntensity: 10,
            emissive: 0x11151c,
        });
        
        const loader = new FBXLoader();
        const scale = 0.03;
        const body = await loader.loadAsync('https://miroleon.github.io/daily-assets/body_03.fbx');
        this.bodyMixer = new THREE.AnimationMixer(body);
        this.bodyMixer.clipAction(body.animations[0]).play();
        body.traverse((child) => { if (child.isMesh) child.material = blobMaterial; });
        body.position.set(0, -5, 0);
        body.scale.setScalar(scale);
        this.scene.add(body);

        const eyes = await loader.loadAsync('https://miroleon.github.io/daily-assets/eyes_03.fbx');
        this.eyesMixer = new THREE.AnimationMixer(eyes);
        this.eyesMixer.clipAction(eyes.animations[0]).play();
        eyes.traverse((child) => { if (child.isMesh) child.material = uniMaterial; });
        eyes.position.set(0, -5, 0);
        eyes.scale.setScalar(scale);
        this.scene.add(eyes);

        // --- ESTILO RESTAURADO: Névoa ---
        
        
        const renderScene = new RenderPass(this.scene, this.camera);
        const afterimagePass = new AfterimagePass();
        afterimagePass.uniforms['damp'].value = 0.40;

        // --- ESTILO RESTAURADO: Bloom Pass ---
        const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1.15, 1, 0.1);
        
        this.composer = new EffectComposer(this.renderer);
        this.composer.addPass(renderScene);
        this.composer.addPass(afterimagePass);
        this.composer.addPass(bloomPass);

        this.memorySystem = new MemorySystem(this.scene, this.camera, this.renderer, this.composer);
        this.memorySystem.startMemoryGame();

        window.addEventListener('resize', this.resizeListener);
        window.addEventListener('click', this.clickListener);
    }

    destroy() {
        console.log("Destruindo HopeGameplayScene");
        window.removeEventListener('resize', this.resizeListener);
        window.removeEventListener('click', this.clickListener);

        if(this.memorySystem){
            clearInterval(this.memorySystem.memorySpawner);
            clearInterval(this.memorySystem.progressDrainInterval);
        }

        this.scene.traverse(object => {
            if (object.isMesh) {
                if (object.geometry) object.geometry.dispose();
                if (object.material) object.material.dispose();
            }
        });
        this.scene.clear();
    }

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.composer.setSize(window.innerWidth, window.innerHeight);
    }

    update() {
        const delta = this.clock.getDelta();
        // --- ESTILO RESTAURADO: Velocidade da animação ---
        if (this.bodyMixer) this.bodyMixer.update(delta / 2);
        if (this.eyesMixer) this.eyesMixer.update(delta / 2);
        
        // --- ESTILO RESTAURADO: Movimento de câmara ---
        this.theta += 0.005;
        this.camera.position.x = -Math.sin(this.theta + 1) * 45;
        this.camera.position.z = -Math.cos(this.theta + 1) * 45;
        this.camera.position.y = 20 * Math.cos(this.theta + 1) + 20;
        this.camera.lookAt(0, 5, 0);
    }

    render() {
        if (this.composer) this.composer.render();
    }
}

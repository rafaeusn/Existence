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
        this.renderer = renderer; // Usa o renderer compartilhado
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.clock = new THREE.Clock();
        
        this.theta = 0;
        this.composer = null;
        this.memorySystem = null;
        this.backgroundMusic = new Audio('./assets/backgroundmusic.mp3');
        
        this.resizeListener = this.onWindowResize.bind(this);
        this.clickListener = (event) => {
            if (this.memorySystem) this.memorySystem.onPointerClick(event);
        };
    }

    async init() {
        this.renderer.setClearColor(0x000000, 1); // Fundo opaco
        this.camera.position.set(0, 40, 20);

        const hdrEquirect = await new RGBELoader().loadAsync('https://miroleon.github.io/daily-assets/gradient_13.hdr');
        hdrEquirect.mapping = THREE.EquirectangularReflectionMapping;
        this.scene.environment = hdrEquirect;
        
        const blobMaterial = new THREE.MeshPhysicalMaterial({
            color: 0xffffff, roughness: 0.3, metalness: 0,
            envMap: hdrEquirect, envMapIntensity: 5.5,
        });
        const uniMaterial = new THREE.MeshPhysicalMaterial({
            envMap: hdrEquirect, envMapIntensity: 200.5, emissive: 0x11151c,
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

        this.scene.fog = new THREE.FogExp2(0x11151c, 0.015);
        
        const renderScene = new RenderPass(this.scene, this.camera);
        const afterimagePass = new AfterimagePass();
        afterimagePass.uniforms['damp'].value = 0.85;
        const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1.35, 0.1, 1);
        
        this.composer = new EffectComposer(this.renderer);
        this.composer.addPass(renderScene);
        this.composer.addPass(afterimagePass);
        this.composer.addPass(bloomPass);

        this.memorySystem = new MemorySystem(this.scene, this.camera, this.renderer, this.composer);
        this.memorySystem.startMemoryGame();

        window.addEventListener('resize', this.resizeListener);
        window.addEventListener('click', this.clickListener);

        this.backgroundMusic.loop = true;
        this.backgroundMusic.play();
    }

    destroy() {
        console.log("Destruindo HopeGameplayScene");
        this.backgroundMusic.pause();
        this.backgroundMusic.currentTime = 0;
        window.removeEventListener('resize', this.resizeListener);
        window.removeEventListener('click', this.clickListener);

        if(this.memorySystem){
            // Garante que todos os intervalos sejam limpos
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
        if (this.bodyMixer) this.bodyMixer.update(delta / 2);
        if (this.eyesMixer) this.eyesMixer.update(delta / 2);
        
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

import * as THREE from 'https://cdn.skypack.dev/three@0.136.0';
import { RGBELoader } from 'https://cdn.skypack.dev/three@0.136.0/examples/jsm/loaders/RGBELoader.js';
import { EffectComposer } from 'https://cdn.skypack.dev/three@0.136.0/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'https://cdn.skypack.dev/three@0.136.0/examples/jsm/postprocessing/RenderPass.js';
import { AfterimagePass } from 'https://cdn.skypack.dev/three@0.136.0/examples/jsm/postprocessing/AfterimagePass.js';
import { UnrealBloomPass } from 'https://cdn.skypack.dev/three@0.136.0/examples/jsm/postprocessing/UnrealBloomPass.js';
import { FBXLoader } from 'https://cdn.skypack.dev/three@0.136.0/examples/jsm/loaders/FBXLoader.js';
import { createEndGameScreen } from '../utils/button-manager.js';

export default class HopeDepressedScene {
    constructor(renderer) {
        this.renderer = renderer;
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(18.5, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.clock = new THREE.Clock();
        
        this.colorProgress = 0;
        this.transitionSpeed = 0.10;
        this.buttonTimeout = null;
        
        this.resizeListener = this.onWindowResize.bind(this);
    }

    async init(sceneData = {}) {
        // Reinicia o estado da animação e o temporizador do botão
        this.colorProgress = 0;
        if (this.buttonTimeout) clearTimeout(this.buttonTimeout);

        this.renderer.setClearColor(0x000000);
        this.camera.position.set(0, 10, 45);
        this.camera.lookAt(0, 6.5, 0);

        const hdrEquirect = await new RGBELoader().loadAsync('https://miroleon.github.io/daily-assets/gradient_4_comp.hdr');
        hdrEquirect.mapping = THREE.EquirectangularReflectionMapping;
        this.scene.environment = hdrEquirect;

        // Cria os materiais para esta instância da cena
        this.blob_mat = new THREE.MeshPhysicalMaterial({ color: new THREE.Color(0xffffff), roughness: 0.3, metalness: 0, envMap: hdrEquirect, envMapIntensity: 0.5 });
        this.uni_mat = new THREE.MeshPhysicalMaterial({ envMap: hdrEquirect, envMapIntensity: 10, emissive: 0x11151c });
        
        const scale = 0.03;
        const loader = new FBXLoader();
        
        this.body_01 = await loader.loadAsync('https://miroleon.github.io/daily-assets/body_03.fbx');
        this.body_01_mixer = new THREE.AnimationMixer(this.body_01);
        this.body_01_mixer.clipAction(this.body_01.animations[0]).play();
        this.body_01.traverse(child => { if (child.isMesh) child.material = this.blob_mat; });
        this.body_01.position.set(0, -5, 0);
        this.body_01.scale.setScalar(scale);
        this.scene.add(this.body_01);

        this.eyes_01 = await loader.loadAsync('https://miroleon.github.io/daily-assets/eyes_03.fbx');
        this.eyes_01_mixer = new THREE.AnimationMixer(this.eyes_01);
        this.eyes_01_mixer.clipAction(this.eyes_01.animations[0]).play();
        this.eyes_01.traverse(child => { if (child.isMesh) child.material = this.uni_mat; });
        this.eyes_01.position.set(0, -5, 0);
        this.eyes_01.scale.setScalar(scale);
        this.scene.add(this.eyes_01);

        this.scene.fog = new THREE.FogExp2(0x000000, 0.015);

        const renderScene = new RenderPass(this.scene, this.camera);
        const afterimagePass = new AfterimagePass();
        afterimagePass.uniforms['damp'].value = 0.85;
        const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1.35, 0.1, 1);
        
        this.composer = new EffectComposer(this.renderer);
        this.composer.addPass(renderScene);
        this.composer.addPass(afterimagePass);
        this.composer.addPass(bloomPass);

        this.buttonTimeout = setTimeout(() => {
            createEndGameScreen(sceneData.message, sceneData.score, () => {
                window.dispatchEvent(new CustomEvent('changeScene', { 
                    detail: { sceneName: 'hopeGameplay' }
                }));
            });
        }, 5000);

        window.addEventListener('resize', this.resizeListener);
    }

    destroy() {
        console.log("Destruindo HopeDepressedScene");
        window.removeEventListener('resize', this.resizeListener);
        if (this.buttonTimeout) clearTimeout(this.buttonTimeout);
        document.getElementById('game-over-screen')?.remove();

        this.scene.traverse(object => {
            if (!object.isMesh) return;
            object.geometry.dispose();
            if (object.material.isMaterial) {
                object.material.dispose();
            } else {
                for (const material of object.material) material.dispose();
            }
        });
        this.scene.clear();
    }
    
    update() {
        const delta = this.clock.getDelta();
        if (this.body_01_mixer) this.body_01_mixer.update(delta / 2);
        if (this.eyes_01_mixer) this.eyes_01_mixer.update(delta / 2);
        if (this.body_01) this.body_01.position.z -= delta * 5.5;
        if (this.eyes_01) this.eyes_01.position.z -= delta * 5.5;

        if (this.colorProgress < 1) {
            this.colorProgress += delta * this.transitionSpeed;
            this.blob_mat.color.lerp(new THREE.Color(0x000000), delta * this.transitionSpeed);
            this.uni_mat.envMapIntensity = THREE.MathUtils.lerp(10, 0, this.colorProgress);
        }
    }
    
    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.composer.setSize(window.innerWidth, window.innerHeight);
    }

    render() {
        if (this.composer) this.composer.render();
    }
}

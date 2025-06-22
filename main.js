import * as THREE from 'https://cdn.skypack.dev/three@0.136.0';
import HandsScene from './Existence/scenes/HandsScene.js';
import HopeDepressedScene from './Existence/scenes/HopeDepressedScene.js';
import HopeGameplayScene from './Existence/scenes/HopeGameplayScene.js';
import HopeWinGameScene from './Existence/scenes/HopeWinGameScene.js';

let renderer, scenes, currentScene;
let animationFrameId;

// --- Gestor de música global ---
const backgroundMusic = new Audio('./assets/backgroundmusic.mp3');
backgroundMusic.loop = true; // Garante que a música recomece quando acabar

function stopAnimate() {
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
    }
}

function animate() {
    if (currentScene) {
        currentScene.update();
        currentScene.render();
    }
    animationFrameId = requestAnimationFrame(animate);
}

async function initScene(sceneName, sceneData = {}) {
    stopAnimate();
    if (currentScene && typeof currentScene.destroy === 'function') {
        currentScene.destroy();
    }
    
    currentScene = scenes[sceneName];
    if (!currentScene) {
        console.error(`A cena "${sceneName}" não existe! Verifique o nome.`);
        return;
    }
    await currentScene.init(sceneData); 
    
    document.getElementById('preloader').style.display = 'none';
    animate();
}

window.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('canvas');
    renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);

    scenes = {
        hands: new HandsScene(renderer),
        hopeDepressed: new HopeDepressedScene(renderer),
        hopeGameplay: new HopeGameplayScene(renderer),
        hopeWinGame: new HopeWinGameScene(renderer) 
    };
    
    currentScene = null;

    const aboutContainer = document.getElementById("aboutContainer");
    const aboutButton = document.getElementById("aboutButton");
    const closeAbout = document.getElementById("closeAbout");
    const startButton = document.getElementById("startButton");

    aboutButton.addEventListener("click", () => aboutContainer.classList.toggle("visible"));
    closeAbout.addEventListener("click", () => aboutContainer.classList.remove("visible"));

    startButton.addEventListener("click", () => {
        const textContainer = document.querySelector('.text-container');
        const menu = document.querySelector('.menu');

        textContainer?.classList.add('fade-out');
        menu?.classList.add('fade-out');
        
        setTimeout(() => {
            if(textContainer) textContainer.style.display = 'none';
            if(menu) menu.style.display = 'none';
        }, 500);
        
        initScene('hopeGameplay');
    });

    window.addEventListener('click', () => {
        if (backgroundMusic.paused) {
            backgroundMusic.play().catch(error => {
                console.warn("A música não pôde ser reproduzida automaticamente:", error);
            });
        }
    }, { once: true });

    window.addEventListener('changeScene', (event) => {
        const { sceneName, ...sceneData } = event.detail;
        if (scenes[sceneName]) {
            initScene(sceneName, sceneData);
        } else {
            console.error(`Cena "${sceneName}" não encontrada!`);
        }
    });

    window.addEventListener('resetGame', () => {
        console.log("A recriar cenas de fim de jogo para reiniciar o estado...");
        scenes.hopeDepressed = new HopeDepressedScene(renderer);
        scenes.hopeWinGame = new HopeWinGameScene(renderer);
    });

    initScene('hands');
});

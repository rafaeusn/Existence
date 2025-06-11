let score = 0;
let badMemories = 0;
let gameDuration = 60 * 1000; // 1 minuto
let memoryInterval = 800; // tempo entre surgimento de memórias
let memoryLifetime = 1500; // tempo de vida da memória na tela (ms)
let gameOver = false;

function spawnMemory() {
  if (gameOver) return;

  const memory = document.createElement("img");
  const isGood = Math.random() > 0.3; // 70% boas, 30% ruins

  memory.src = isGood ? "memorygood.png" : "memorybad.png";
  memory.classList.add("memory");
  memory.style.position = "absolute";
  memory.style.width = "60px";
  memory.style.height = "60px";
  memory.style.top = Math.random() * (window.innerHeight - 60) + "px";
  memory.style.left = Math.random() * (window.innerWidth - 60) + "px";
  memory.style.cursor = "pointer";
  memory.style.zIndex = 5;

  document.body.appendChild(memory);

  const timeout = setTimeout(() => {
    if (document.body.contains(memory)) {
      memory.remove();
    }
  }, memoryLifetime);

  memory.addEventListener("click", () => {
    clearTimeout(timeout);
    memory.remove();

    if (isGood) {
      score++;
    } else {
      badMemories++;
    }

    checkGameState();
  });
}

function checkGameState() {
  if (badMemories >= 3) {
    endGame("Você clicou em 3 memórias ruins. Game Over.");
  } else if (score >= 30) {
    endGame("Você coletou 30 memórias boas. Vitória!");
  }
}

function endGame(message) {
  gameOver = true;
  alert(message);
  // Opcional: Reiniciar ou mostrar botão de reinício
}

// Iniciar o ciclo das memórias ao carregar o jogo
setTimeout(() => {
  const memorySpawner = setInterval(() => {
    if (!gameOver) spawnMemory();
    else clearInterval(memorySpawner);
  }, memoryInterval);

  setTimeout(() => {
    if (!gameOver) endGame("Tempo esgotado!");
  }, gameDuration);
}, 2000); // espera um pouco após o preload

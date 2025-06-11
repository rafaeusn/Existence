const aboutContainer = document.getElementById("aboutContainer");
const startButton = document.getElementById("startButton");
const aboutButton = document.getElementById("aboutButton");
const closeAbout = document.getElementById("closeAbout");
const preloader = document.getElementById("preloader"); // div do preloader no HTML

// No início, garante que preloader esteja escondido
preloader.style.display = "none";

// Função segura para trocar scripts modulares com callback onload
function loadScriptSafely(newSrc, onLoadCallback) {
  const oldScript = document.getElementById("dynamicScript");
  if (oldScript) oldScript.remove();

  const script = document.createElement("script");
  script.type = "module";
  script.src = newSrc;
  script.id = "dynamicScript";

  if (onLoadCallback) {
    script.onload = onLoadCallback;
  }

  document.body.appendChild(script);
}

startButton.addEventListener("click", () => {
  // Esconde o menu e o título imediatamente
  aboutContainer.classList.remove("visible");
  document.querySelector(".menu").style.display = "none";
  document.querySelector(".text-container").style.display = "none";

  // Mostra o preloader
  preloader.style.display = "flex";

  // Carrega o script hopedepressed.js e esconde preloader quando terminar
  loadScriptSafely("hopegameplay.js", () => {
    // Pequeno delay para suavizar a transição (opcional)
    setTimeout(() => {
      preloader.style.display = "none";
    }, 2000);
  });
});

aboutButton.addEventListener("click", () => {
  aboutContainer.classList.add("visible");
});

closeAbout.addEventListener("click", () => {
  aboutContainer.classList.remove("visible");
});

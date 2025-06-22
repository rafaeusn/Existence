/**
 * Cria e exibe uma tela de fim de jogo (vitória ou derrota).
 * @param {string} message - A mensagem principal a ser exibida (ex: "Vitória!").
 * @param {number} score - A pontuação final do jogador.
 * @param {function} onRestartCallback - A função a ser executada quando o botão "Jogar Novamente" for clicado.
 */
export function createEndGameScreen(message, score, onRestartCallback) {
    // Remove qualquer tela final anterior para evitar duplicatas.
    const oldScreen = document.getElementById('game-over-screen');
    if (oldScreen) {
        oldScreen.remove();
    }

    // Cria o contêiner da tela final.
    const endScreen = document.createElement('div');
    endScreen.id = 'game-over-screen'; // ID único para a tela
    endScreen.classList.add('game-over'); // Reutiliza o seu estilo CSS.

    endScreen.innerHTML = `
        <p>${message}</p>
        <p>Memórias boas: ${score}</p>
        <button id="restartButton">Jogar Novamente</button>
    `;

    document.body.appendChild(endScreen);

    // Adiciona a classe 'visible' para a animação de fade-in.
    setTimeout(() => {
        endScreen.classList.add('visible');
    }, 10);

    const restartButton = document.getElementById('restartButton');
    restartButton.addEventListener('click', () => {
        // Dispara um evento global para que o main.js saiba que precisa de recriar as cenas.
        window.dispatchEvent(new CustomEvent('resetGame'));
        
        // Animação de fade-out.
        endScreen.classList.remove('visible');
        
        // Espera a animação terminar antes de executar a lógica de reinício.
        setTimeout(() => {
            endScreen.remove();
            onRestartCallback(); // Executa a função de reinício (mudar de cena).
        }, 500); 
    }, { once: true }); // Garante que o botão só possa ser clicado uma vez.
}

// /modules/shared/components/SnackbarComponent.js (NOVO)
'use strict';

import { formatarMoeda } from '../lib/utils.js'; // Importa se necessário para formatar dentro do snackbar

const DEFAULT_DURATION = 5000; // Duração padrão em ms

/**
 * Cria e retorna um elemento DOM para um Snackbar.
 * @param {string} message - A mensagem a ser exibida.
 * @param {object} options - Opções adicionais.
 * @param {string} [options.actionText] - Texto para o botão de ação (opcional).
 * @param {Function} [options.actionCallback] - Função a ser chamada quando a ação é clicada.
 * @param {number} [options.duration=DEFAULT_DURATION] - Duração em milissegundos.
 * @param {Function} [options.onDismiss] - Callback chamado quando o snackbar é dispensado (opcional).
 * @returns {HTMLElement} O elemento Snackbar criado.
 */
export function createSnackbarElement(message, options = {}) {
    const {
        actionText,
        actionCallback,
        duration = DEFAULT_DURATION,
        onDismiss
    } = options;

    const snackbarElement = document.createElement('div');
    snackbarElement.className = 'snackbar'; // Classe base

    const messageElement = document.createElement('span');
    messageElement.className = 'snackbar-message';
    messageElement.textContent = message;
    snackbarElement.appendChild(messageElement);

    let actionButton = null;
    if (actionText && typeof actionCallback === 'function') {
        actionButton = document.createElement('button');
        actionButton.className = 'snackbar-action';
        actionButton.textContent = actionText;
        actionButton.addEventListener('click', () => {
            actionCallback();
            // Opcional: Dispensar imediatamente ao clicar na ação
            dismiss();
        });
        snackbarElement.appendChild(actionButton);
    }

    // Função para dispensar o snackbar (animação de saída e remoção)
    const dismiss = () => {
        snackbarElement.classList.remove('visible');
        snackbarElement.addEventListener('transitionend', () => {
            snackbarElement.remove();
            if (typeof onDismiss === 'function') {
                onDismiss(); // Notifica o serviço que foi dispensado
            }
        }, { once: true });
    };

    // Timeout para auto-dispensar
    const dismissTimeout = setTimeout(dismiss, duration);

    // Opcional: Pausar o timeout se o rato estiver sobre o snackbar
    snackbarElement.addEventListener('mouseenter', () => clearTimeout(dismissTimeout));
    // snackbarElement.addEventListener('mouseleave', () => dismissTimeout = setTimeout(dismiss, duration)); // Reativar pode ser complexo, simplificar por agora

    // Adiciona a classe 'visible' após um pequeno delay para acionar a animação de entrada
    requestAnimationFrame(() => {
        requestAnimationFrame(() => { // Duplo requestAnimationFrame para garantir o reflow
             snackbarElement.classList.add('visible');
        });
    });


    // Retorna o elemento criado e a sua função de dispensa
    return { element: snackbarElement, dismiss };
}

export default {
    createSnackbarElement
};
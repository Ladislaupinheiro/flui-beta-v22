// /modules/shared/components/Toast.js (REFATORADO COM CRIAÇÃO DINÂMICA)
'use strict';

let toastContainer = null;

const ICONS = {
    success: 'lni-checkmark-circle',
    error: 'lni-warning',
    info: 'lni-information'
};

/**
 * Exibe uma notificação toast.
 * Cria um novo elemento para cada notificação e o anexa ao container.
 * O elemento se auto-remove após a animação.
 * @param {string} message - A mensagem a ser exibida.
 * @param {string} [type='success'] - O tipo de notificação ('success', 'error', 'info').
 * @param {number} [duration=3000] - A duração em milissegundos.
 */
export function mostrarNotificacao(message, type = 'success', duration = 3000) {
    if (!toastContainer) {
        console.error('Toast container não foi inicializado. Chame Toast.init() primeiro.');
        return;
    }

    const toastElement = document.createElement('div');
    toastElement.className = `toast-notification ${type}`;

    const iconClass = ICONS[type] || ICONS.info;
    
    toastElement.innerHTML = `
        <i class="lni ${iconClass} toast-icon"></i>
        <span class="toast-message">${message}</span>
    `;

    toastContainer.appendChild(toastElement);

    setTimeout(() => {
        toastElement.classList.add('visible');
    }, 10);

    setTimeout(() => {
        toastElement.classList.remove('visible');
        toastElement.addEventListener('transitionend', () => {
            toastElement.remove();
        }, { once: true });
    }, duration);
}

/**
 * Inicializa o módulo Toast, obtendo a referência ao container.
 * Deve ser chamado uma vez no arranque da aplicação.
 */
export function init() {
    toastContainer = document.getElementById('toast-container');
}
// /modules/shared/services/SnackbarService.js (NOVO)
'use strict';

import SnackbarComponent from '../components/SnackbarComponent.js';

let snackbarContainer = null;
let snackbarQueue = []; // Fila para gerenciar snackbars
let isShowing = false; // Flag para indicar se um snackbar está visível

/**
 * Exibe o próximo snackbar na fila, se houver um e nenhum estiver sendo exibido.
 */
function showNextSnackbar() {
    if (isShowing || snackbarQueue.length === 0) {
        return; // Sai se já está mostrando um ou se a fila está vazia
    }

    isShowing = true;
    const { message, options } = snackbarQueue.shift(); // Pega o próximo da fila

    // Define um callback para ser chamado quando o snackbar for dispensado
    const onDismiss = () => {
        isShowing = false; // Libera a flag
        // Atraso mínimo antes de mostrar o próximo para evitar sobreposição visual
        setTimeout(showNextSnackbar, 150); 
    };

    // Cria o elemento Snackbar usando o SnackbarComponent
    const { element, dismiss } = SnackbarComponent.createSnackbarElement(message, { ...options, onDismiss });

    // Adiciona o elemento ao container
    if (snackbarContainer) {
        snackbarContainer.appendChild(element);
    } else {
        console.error('Snackbar container não encontrado.');
        isShowing = false; // Reseta a flag se não puder mostrar
    }
}

/**
 * Adiciona uma nova mensagem à fila do Snackbar.
 * @param {string} message - A mensagem a ser exibida.
 * @param {object} [options={}] - Opções (actionText, actionCallback, duration).
 */
export function showSnackbar(message, options = {}) {
    if (!snackbarContainer) {
        console.error('SnackbarService não inicializado. Chame SnackbarService.init() primeiro.');
        return;
    }
    
    // Adiciona a nova solicitação à fila
    snackbarQueue.push({ message, options });

    // Tenta exibir o próximo (só funcionará se nenhum estiver ativo)
    showNextSnackbar();
}

/**
 * Inicializa o SnackbarService, obtendo a referência ao container.
 * Deve ser chamado uma vez no arranque da aplicação.
 */
export function init() {
    snackbarContainer = document.getElementById('snackbar-container');
    if (!snackbarContainer) {
        console.error('Elemento #snackbar-container não encontrado no DOM.');
    }
}

export default {
    init,
    showSnackbar
};
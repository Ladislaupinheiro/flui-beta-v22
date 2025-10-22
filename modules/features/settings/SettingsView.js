// /modules/features/settings/SettingsView.js (REFATORADO COMO HUB DE NAVEGAÇÃO)
'use strict';

import store from '../../shared/services/Store.js';
import ThemeService from '../../shared/services/ThemeService.js';
import { abrirModalBackupRestore } from '../../shared/components/Modals.js';
import Router from '../../app/Router.js';

let viewNode = null;
let unsubscribe = null;

function render() {
    const isChecked = ThemeService.getCurrentTheme() === 'dark';

    return `
        <div class="view-container">
            <header class="page-header sticky-header">
                <button id="btn-close-settings" class="header-action-btn back-btn">
                    <i class="lni lni-arrow-left"></i>
                </button>
                <h2 class="page-title">Configurações</h2>
                <div></div> <!-- Espaçador para alinhar o título -->
            </header>

            <main class="page-content">
                <div class="card list-card">
                    <button class="button-list-item" data-action="navigate" data-route="#settings/business-info">
                        <i class="lni lni-apartment"></i>
                        <span>Informações do Negócio</span>
                        <i class="lni lni-chevron-right list-arrow"></i>
                    </button>
                    <div class="button-list-item">
                        <i class="lni lni-night"></i>
                        <span>Tema Escuro</span>
                        <div class="toggle-switch-container">
                            <label class="toggle-switch">
                                <input type="checkbox" id="theme-switch-input" ${isChecked ? 'checked' : ''}>
                                <span class="slider"></span>
                            </label>
                        </div>
                    </div>
                </div>

                <div class="card list-card">
                    <button class="button-list-item" data-action="open-modal" data-modal="backup">
                        <i class="lni lni-database"></i>
                        <span>Gestão de Dados (Backup)</span>
                        <i class="lni lni-chevron-right list-arrow"></i>
                    </button>
                </div>
                
                <div class="card list-card">
                     <button class="button-list-item" data-action="navigate" data-route="#about">
                        <i class="lni lni-information-circle"></i>
                        <span>Sobre o Flui</span>
                        <i class="lni lni-chevron-right list-arrow"></i>
                    </button>
                </div>
            </main>
        </div>
    `;
}

function mount() {
    viewNode = document.getElementById('app-root');
    viewNode.innerHTML = render();

    const handleViewClick = (e) => {
        const target = e.target;
        
        if (target.closest('#btn-close-settings')) {
            Router.navigateTo('#dashboard'); // Ou a última rota visitada
            return;
        }

        const actionButton = target.closest('.button-list-item');
        if (actionButton) {
            const action = actionButton.dataset.action;
            if (action === 'navigate') {
                Router.navigateTo(actionButton.dataset.route);
            } else if (action === 'open-modal') {
                if (actionButton.dataset.modal === 'backup') {
                    abrirModalBackupRestore();
                }
            }
        }
    };

    const handleThemeToggle = () => {
        ThemeService.toggleTheme();
    };

    viewNode.addEventListener('click', handleViewClick);
    viewNode.querySelector('#theme-switch-input')?.addEventListener('change', handleThemeToggle);

    // Subscrição para re-renderizar o toggle se o tema for mudado por outro meio
    unsubscribe = store.subscribe(() => {
        const newIsChecked = ThemeService.getCurrentTheme() === 'dark';
        const toggle = viewNode.querySelector('#theme-switch-input');
        if (toggle && toggle.checked !== newIsChecked) {
            toggle.checked = newIsChecked;
        }
    });
}

function unmount() {
    if(unsubscribe) unsubscribe();
    // Os event listeners são removidos pelo Router ao substituir o innerHTML
    viewNode = null;
    unsubscribe = null;
}

export default {
    render,
    mount,
    unmount
};
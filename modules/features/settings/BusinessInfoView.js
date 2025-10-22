// /modules/features/settings/BusinessInfoView.js (NOVO)
'use strict';

import store from '../../shared/services/Store.js';
import Router from '../../app/Router.js';
import * as Toast from '../../shared/components/Toast.js';

let viewNode = null;

function render() {
    const state = store.getState();
    const { config } = state;

    return `
        <form id="form-business-info" class="view-container">
            <header class="page-header sticky-header">
                <button type="button" id="btn-back-to-settings" class="header-action-btn back-btn">
                    <i class="lni lni-arrow-left"></i>
                </button>
                <h2 class="page-title">Informações do Negócio</h2>
                <div></div> <!-- Espaçador para centralizar o título -->
            </header>

            <main class="page-content">
                <div class="card">
                    <div class="card-body">
                        <div class="form-group">
                            <label for="config-business-name" class="form-label">Nome do Estabelecimento</label>
                            <input type="text" id="config-business-name" class="input-field" value="${config.businessName || ''}">
                        </div>
                        <div class="form-group">
                            <label for="config-nif" class="form-label">NIF</label>
                            <input type="text" id="config-nif" class="input-field" value="${config.nif || ''}">
                        </div>
                        <div class="form-group">
                            <label for="config-endereco" class="form-label">Endereço</label>
                            <input type="text" id="config-endereco" class="input-field" value="${config.endereco || ''}">
                        </div>
                        <div class="form-grid-2-col">
                            <div class="form-group">
                                <label for="config-telefone" class="form-label">Telefone</label>
                                <input type="tel" id="config-telefone" class="input-field" value="${config.telefone || ''}">
                            </div>
                            <div class="form-group">
                                <label for="config-email" class="form-label">Email</label>
                                <input type="email" id="config-email" class="input-field" value="${config.email || ''}">
                            </div>
                        </div>
                    </div>
                </div>
            </main>
            
            <div class="bottom-action-bar">
                <button type="submit" class="button button-primary full-width">Salvar Alterações</button>
            </div>
        </form>
    `;
}

function mount() {
    viewNode = document.getElementById('app-root');
    viewNode.innerHTML = render();

    const form = viewNode.querySelector('#form-business-info');

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const newConfig = {
            businessName: viewNode.querySelector('#config-business-name').value.trim(),
            nif: viewNode.querySelector('#config-nif').value.trim(),
            endereco: viewNode.querySelector('#config-endereco').value.trim(),
            telefone: viewNode.querySelector('#config-telefone').value.trim(),
            email: viewNode.querySelector('#config-email').value.trim(),
        };

        store.dispatch({ type: 'UPDATE_CONFIG', payload: newConfig });
        Toast.mostrarNotificacao("Informações salvas com sucesso!");
        Router.navigateTo('#settings');
    });

    viewNode.querySelector('#btn-back-to-settings')?.addEventListener('click', () => {
        Router.navigateTo('#settings');
    });
}

function unmount() {
    viewNode = null;
}

export default {
    render,
    mount,
    unmount
};
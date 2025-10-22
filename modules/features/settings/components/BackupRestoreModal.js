// /modules/features/settings/components/BackupRestoreModal.js (REFATORADO COM ESTRUTURA SEMÂNTICA)
'use strict';

import store from '../../../shared/services/Store.js';
import * as Toast from '../../../shared/components/Toast.js';
import * as Storage from '../../../shared/services/Storage.js';
import { abrirModalConfirmacao } from '../../../shared/components/Modals.js';

export const render = () => `
<div id="modal-backup-restore-overlay" class="modal-overlay">
    <div class="modal-container">
        <header class="modal-header">
            <h3 class="modal-title">Backup e Restauro</h3>
            <button type="button" class="modal-close-button">&times;</button>
        </header>
        <div class="modal-body">
            <div class="backup-section">
                <h4 class="section-title">Criar Backup</h4>
                <p class="section-description">Guarde todos os dados da aplicação num ficheiro JSON seguro.</p>
                <button id="btn-criar-backup" class="button button-primary full-width">
                    <i class="lni lni-download"></i> Criar e Descarregar
                </button>
            </div>
            <div class="restore-section">
                <h4 class="section-title error">Restaurar de Ficheiro</h4>
                <p class="section-description">Atenção: Restaurar um backup irá apagar TODOS os dados atuais.</p>
                <input type="file" id="input-restaurar-backup" class="hidden-input">
                <button id="btn-abrir-seletor-ficheiro" class="button button-error full-width">
                    <i class="lni lni-upload"></i> Selecionar Ficheiro
                </button>
            </div>
        </div>
    </div>
</div>`;

const handleRestore = (e, closeModal) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
        try {
            const backupData = JSON.parse(ev.target.result);
            if (backupData.appName !== 'GestorBarPro' || !backupData.data) throw new Error("Ficheiro de backup inválido.");
            
            closeModal();
            abrirModalConfirmacao(
                'Confirmar Restauro?',
                'Todos os dados atuais serão PERMANENTEMENTE apagados. A aplicação será reiniciada.',
                async () => {
                    Toast.mostrarNotificacao("A restaurar... A aplicação irá recarregar.");
                    const storesToClear = [
                        'inventario', 'contas', 'historico', 'clientes', 'despesas', 'config', 
                        'fornecedores', 'historicoCompras', 'tagsDeCliente', 'categoriasDeProduto'
                    ];
                    await Promise.all(storesToClear.map(storeName => Storage.limparStore(storeName)));
                    
                    const { 
                        inventario, contasAtivas, historicoFechos, clientes, despesas, config,
                        fornecedores, historicoCompras, categoriasDeProduto, tagsDeCliente 
                    } = backupData.data;

                    const allPromises = [
                        ...(inventario || []).map(item => Storage.salvarItem('inventario', item)),
                        ...(contasAtivas || []).map(item => Storage.salvarItem('contas', item)),
                        ...(historicoFechos || []).map(item => Storage.salvarItem('historico', item)),
                        ...(clientes || []).map(item => Storage.salvarItem('clientes', item)),
                        ...(despesas || []).map(item => Storage.salvarItem('despesas', item)),
                        Storage.salvarItem('config', { key: 'appConfig', ...(config || {}) }),
                        ...(fornecedores || []).map(item => Storage.salvarItem('fornecedores', item)),
                        ...(historicoCompras || []).map(item => Storage.salvarItem('historicoCompras', item)),
                        ...(tagsDeCliente || []).map(item => Storage.salvarItem('tagsDeCliente', item)),
                        ...(categoriasDeProduto || []).map(item => Storage.salvarItem('categoriasDeProduto', item))
                    ];

                    await Promise.all(allPromises);

                    setTimeout(() => window.location.reload(), 1500);
                }
            );
        } catch (error) { Toast.mostrarNotificacao(error.message, "erro"); }
    };
    reader.readAsText(file);
};

export const mount = (closeModal) => {
    const overlay = document.getElementById('modal-backup-restore-overlay');
    const inputRestore = overlay.querySelector('#input-restaurar-backup');

    overlay.querySelector('#btn-criar-backup').addEventListener('click', () => {
        const state = store.getState();
        const backupData = { appName: 'GestorBarPro', version: state.schema_version, timestamp: new Date().toISOString(), data: state };
        const jsonString = JSON.stringify(backupData, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `gestorbar-backup-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        Toast.mostrarNotificacao("Backup criado com sucesso!");
    });

    overlay.querySelector('#btn-abrir-seletor-ficheiro').addEventListener('click', () => inputRestore.click());
    inputRestore.addEventListener('change', (e) => handleRestore(e, closeModal));

    overlay.querySelector('.modal-close-button').addEventListener('click', closeModal);
    overlay.addEventListener('click', e => {
        if (e.target.id === 'modal-backup-restore-overlay') closeModal();
    });
};

export const unmount = () => {};
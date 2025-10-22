// /modules/features/inventario/InventarioView.js (CORRIGIDO: Bug #1/#5 - Bloqueio Navegação)
'use strict';

import store from '../../shared/services/Store.js';
import Router from '../../app/Router.js';
import { abrirModalAddFornecedor, abrirModalAddProduto } from '../../shared/components/Modals.js';
import FornecedoresList from './components/FornecedoresList.js';
import ProdutosGrid from './components/ProdutosGrid.js';

let unsubscribe = null;
let viewNode = null;
let activeSubView = 'fornecedores'; // Mantém o estado da sub-vista ativa

// *** CORREÇÃO: Mover handleViewClick para o escopo do módulo ***
const handleViewClick = (e) => {
    console.log('[InventarioView] Click detectado:', e.target); // DEBUG Log

    const subviewBtn = e.target.closest('[data-subview]');
    if (subviewBtn) {
        const newSubview = subviewBtn.dataset.subview;
        console.log(`[InventarioView] Botão subview clicado: ${newSubview}`); // DEBUG Log
        if (newSubview !== activeSubView) {
            activeSubView = newSubview;
            // Atualiza visualmente os botões das tabs
            viewNode?.querySelectorAll('.main-tabs .segmented-control-button').forEach(btn => {
                btn.classList.toggle('active', btn.dataset.subview === activeSubView);
            });
            console.log(`[InventarioView] Subview alterada para: ${activeSubView}. Atualizando conteúdo...`); // DEBUG Log
            updateViewContent(); // Chama a função para trocar o conteúdo
        } else {
             console.log('[InventarioView] Clicou na subview já ativa.'); // DEBUG Log
        }
        return; // Importante para evitar processamento adicional
    }

    // Lógica do FAB (inalterada)
    if (e.target.closest('#btn-fab-inventario')) {
         console.log('[InventarioView] Botão FAB clicado.'); // DEBUG Log
        if (activeSubView === 'produtos') {
            abrirModalAddProduto(); // Abre modal para adicionar ao catálogo
        } else {
            abrirModalAddFornecedor((novoFornecedor) => {
                // Navega para detalhes após adicionar fornecedor
                Router.navigateTo(`#fornecedor-detalhes/${novoFornecedor.id}`);
            });
        }
        return; // Importante
    }

    // Se o clique não foi numa tab ou no FAB, deixa os componentes filhos (ProdutosGrid/FornecedoresList) tratarem
    // (Os listeners deles serão adicionados nos seus respectivos `mount`)
     console.log('[InventarioView] Click não tratado no nível da View, passando para filhos...'); // DEBUG Log

};


function render() {
    console.log(`[InventarioView] Renderizando com activeSubView: ${activeSubView}`); // DEBUG Log
    return `
        <header class="page-header sticky-header inventory-header">
            <div class="main-segmented-control-container">
                 <div class="segmented-control main-tabs">
                    <button class="segmented-control-button ${activeSubView === 'fornecedores' ? 'active' : ''}" data-subview="fornecedores">Fornecedores</button>
                    <button class="segmented-control-button ${activeSubView === 'produtos' ? 'active' : ''}" data-subview="produtos">Produtos</button>
                </div>
            </div>
        </header>

        <main id="inventario-subview-container" class="page-content-no-padding"></main>

        <button id="btn-fab-inventario" class="fab"><i class="lni lni-plus"></i></button>
    `;
}

function updateViewContent() {
    console.log(`[InventarioView] updateViewContent para: ${activeSubView}`); // DEBUG Log
    if (!viewNode) {
        console.error('[InventarioView] updateViewContent: viewNode é nulo.'); // DEBUG Log
        return;
    }
    const container = viewNode.querySelector('#inventario-subview-container');
    if (!container) {
        console.error('[InventarioView] updateViewContent: container #inventario-subview-container não encontrado.'); // DEBUG Log
        return;
    }

    // Desmonta o componente anterior ANTES de montar o novo
    if (activeSubView === 'produtos') {
        // Desmonta FornecedoresList se estava ativo
        if (typeof FornecedoresList.unmount === 'function') {
            console.log('[InventarioView] Desmontando FornecedoresList...'); // DEBUG Log
            FornecedoresList.unmount();
        }
        // Renderiza e Monta ProdutosGrid
        console.log('[InventarioView] Renderizando e Montando ProdutosGrid...'); // DEBUG Log
        container.innerHTML = ''; // Limpa o container explicitamente
        // ProdutosGrid renderiza sua própria estrutura interna agora
        ProdutosGrid.mount(container); // Passa o container para ProdutosGrid montar-se dentro dele

    } else { // activeSubView === 'fornecedores'
        // Desmonta ProdutosGrid se estava ativo
        if (typeof ProdutosGrid.unmount === 'function') {
            console.log('[InventarioView] Desmontando ProdutosGrid...'); // DEBUG Log
            ProdutosGrid.unmount();
        }
        // Renderiza e Monta FornecedoresList
        console.log('[InventarioView] Renderizando e Montando FornecedoresList...'); // DEBUG Log
        container.innerHTML = FornecedoresList.render();
        FornecedoresList.mount(container);
    }
     console.log('[InventarioView] updateViewContent concluído.'); // DEBUG Log
}


function mount() {
    console.log('[InventarioView] Montando...'); // DEBUG Log
    viewNode = document.getElementById('app-root');
    activeSubView = 'fornecedores'; // Sempre começa em fornecedores ao montar
    if (!viewNode) {
        console.error('[InventarioView] mount: #app-root não encontrado!'); // DEBUG Log
        return;
    }
    viewNode.innerHTML = render();

    // Adiciona o listener de clique ao viewNode (raiz da vista)
    // O handleViewClick agora está no escopo correto
    viewNode.addEventListener('click', handleViewClick);
     console.log('[InventarioView] Listener de clique principal adicionado.'); // DEBUG Log


    // Renderiza o conteúdo da sub-vista inicial
    updateViewContent();

    // Subscrição mínima, pois os filhos gerem suas próprias atualizações
    unsubscribe = store.subscribe(() => {
        // Poderia verificar aqui se algo no estado global exige re-renderizar
        // a estrutura principal da InventarioView, mas por agora está vazio.
         // console.log('[InventarioView] Store atualizado (subscrição mínima).'); // DEBUG Log
    });
     console.log('[InventarioView] Montado com sucesso.'); // DEBUG Log
}

function unmount() {
    console.log('[InventarioView] Desmontando...'); // DEBUG Log
    if (unsubscribe) {
        unsubscribe();
        unsubscribe = null;
        console.log('[InventarioView] Unsubscribe do store feito.'); // DEBUG Log
    }

    // Tenta desmontar os filhos ativos
    if (activeSubView === 'produtos' && typeof ProdutosGrid.unmount === 'function') {
        console.log('[InventarioView] Desmontando ProdutosGrid explicitamente...'); // DEBUG Log
        ProdutosGrid.unmount();
    } else if (activeSubView === 'fornecedores' && typeof FornecedoresList.unmount === 'function') {
        console.log('[InventarioView] Desmontando FornecedoresList explicitamente...'); // DEBUG Log
        FornecedoresList.unmount();
    }


    if (viewNode) {
        // Remove o listener de clique principal da vista
        // O handleViewClick agora está no escopo correto
        viewNode.removeEventListener('click', handleViewClick);
        console.log('[InventarioView] Listener de clique principal removido.'); // DEBUG Log
        viewNode.innerHTML = ''; // Limpa o conteúdo ao desmontar
    } else {
         console.warn('[InventarioView] unmount: viewNode já era nulo.'); // DEBUG Log
    }

    viewNode = null; // Limpa a referência
    // activeSubView será resetado no próximo mount
    console.log('[InventarioView] Desmontado com sucesso.'); // DEBUG Log
}


export default { render, mount, unmount };
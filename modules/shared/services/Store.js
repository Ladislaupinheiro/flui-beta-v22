// /modules/shared/services/Store.js (REATORADO E MODULAR - VERSÃO FINAL COMPLETA)
'use strict';
import * as Storage from './Storage.js';
import { gerarEstadoAposArquivo } from '../lib/utils.js';
import combineReducers from '../store/combineReducers.js';

// Importa todos os slice reducers
import inventarioReducer from '../store/inventarioSlice.js';
import clientesReducer from '../store/clientesSlice.js';
import tagsDeClienteReducer from '../store/tagsDeClienteSlice.js';
import atendimentoReducer from '../store/atendimentoSlice.js';
import despesasReducer from '../store/despesasSlice.js';
import historicoFechosReducer from '../store/historicoFechosSlice.js';
import configReducer from '../store/configSlice.js';
import fornecedoresReducer from '../store/fornecedoresSlice.js';
import historicoComprasReducer from '../store/historicoComprasSlice.js';
import categoriasDeProdutoReducer from '../store/categoriasDeProdutoSlice.js';

// Define o estado inicial da aplicação
export const initialState = {
    schema_version: 14,
    inventario: [],
    clientes: [],
    contasAtivas: [], // Gerido por atendimentoSlice
    historicoFechos: [], // Gerido por historicoFechosSlice
    despesas: [], // Gerido por despesasSlice
    fornecedores: [], // Gerido por fornecedoresSlice
    historicoCompras: [], // Gerido por historicoComprasSlice
    categoriasDeProduto: [], // Gerido por categoriasDeProdutoSlice
    tagsDeCliente: [], // Gerido por tagsDeClienteSlice
    config: { // Gerido por configSlice
        businessName: '',
        nif: '',
        endereco: '',
        telefone: '',
        email: '',
        moeda: 'AOA',
        profilePicDataUrl: null,
        priorityProducts: [],
        mostrarDicaDoDia: true
    }
};

// Classe Store (inalterada na sua estrutura interna)
class Store {
    #state;
    #listeners;
    #reducer;

    constructor(reducer, initialState) {
        this.#reducer = reducer;
        this.#state = initialState;
        this.#listeners = [];
    }

    getState() { return this.#state; }

    dispatch(action) {
        const previousState = this.#state;
        const nextState = this.#reducer(this.#state, action);

        if (nextState !== previousState) {
            this.#state = nextState;
            this.#notify();
            // TODO: Refatorar persistência para ser mais granular e eficiente.
            this.#persistChangesBasedOnAction(action, previousState);
        }
    }

    subscribe(listener) {
        this.#listeners.push(listener);
        return () => {
            this.#listeners = this.#listeners.filter(l => l !== listener);
        };
    }

    #notify() {
        for (const listener of this.#listeners) {
            listener(this.#state);
        }
    }

    // Lógica de persistência original, agora chamada a partir do dispatch
    // Esta função precisa ser refatorada para maior eficiência no futuro.
    #persistChangesBasedOnAction(action, prevState) {
        // Mapeia ações a operações de storage específicas
        const getUpdatedItem = (sliceKey, idKey = 'id') => {
            if (!action.payload) return null;
            const id = typeof action.payload === 'object' ? action.payload[idKey] : action.payload;
            return this.#state[sliceKey]?.find(item => item[idKey] === id);
        };
        const getLastItem = (sliceKey) => this.#state[sliceKey]?.[this.#state[sliceKey].length - 1];

        switch (action.type) {
            case 'UPDATE_CONFIG':
            case 'UPDATE_SHORTCUTS':
                Storage.salvarItem('config', this.#state.config); break;
            case 'ADD_PRODUCT':
                Storage.salvarItem('inventario', getLastItem('inventario')); break;
            case 'UPDATE_PRODUCT':
                Storage.salvarItem('inventario', action.payload); break;
            case 'DELETE_PRODUCT':
                Storage.apagarItem('inventario', action.payload); break;
            case 'MOVE_STOCK': {
                const updatedProduct = getUpdatedItem('inventario', 'produtoId');
                if (updatedProduct) Storage.salvarItem('inventario', updatedProduct);
                break;
            }
            case 'ADD_COMPRA': {
                Storage.salvarItem('historicoCompras', getLastItem('historicoCompras'));
                const updatedProduct = getUpdatedItem('inventario', 'produtoId');
                if (updatedProduct) Storage.salvarItem('inventario', updatedProduct);
                break;
            }
            case 'ADD_CLIENT':
                Storage.salvarItem('clientes', getLastItem('clientes')); break;
            case 'UPDATE_CLIENT':
                Storage.salvarItem('clientes', action.payload); break;
            case 'DELETE_CLIENT':
                Storage.apagarItem('clientes', action.payload); break;
            case 'ADD_DEBT':
            case 'SETTLE_DEBT': {
                const updatedClient = getUpdatedItem('clientes', 'clienteId');
                if (updatedClient) Storage.salvarItem('clientes', updatedClient);
                break;
            }
            case 'ADD_CLIENT_TAG':
                Storage.salvarItem('tagsDeCliente', getLastItem('tagsDeCliente')); break;
            case 'ADD_PRODUCT_CATEGORY':
                 Storage.salvarItem('categoriasDeProduto', getLastItem('categoriasDeProduto')); break;
            case 'DELETE_PRODUCT_CATEGORY':
                 Storage.apagarItem('categoriasDeProduto', action.payload); break;
            case 'ADD_FORNECEDOR':
                Storage.salvarItem('fornecedores', getLastItem('fornecedores')); break;
            case 'UPDATE_FORNECEDOR':
                Storage.salvarItem('fornecedores', action.payload); break;
            case 'DELETE_FORNECEDOR':
                Storage.apagarItem('fornecedores', action.payload); break;
            case 'ADD_PRODUCT_TO_CATALOG': {
                 const updatedSupplier = getUpdatedItem('fornecedores', 'fornecedorId');
                 if (updatedSupplier) Storage.salvarItem('fornecedores', updatedSupplier);
                 break;
            }
            case 'ADD_ACCOUNT':
                Storage.salvarItem('contas', getLastItem('contasAtivas')); break;
            case 'CHANGE_ACCOUNT_CLIENT':
            case 'ADD_ORDER_ITEM':
            case 'REMOVE_ORDER_ITEM':
            case 'UPDATE_ORDER_ITEM_QTD': {
                 const updatedAccount = getUpdatedItem('contasAtivas', 'contaId');
                 if (updatedAccount) Storage.salvarItem('contas', updatedAccount);
                 break;
            }
            case 'FINALIZE_PAYMENT': {
                const finalizedAccount = getUpdatedItem('contasAtivas', 'contaId');
                if (finalizedAccount) Storage.salvarItem('contas', finalizedAccount);
                // Persiste as alterações de stock do FINALIZE_PAYMENT
                const { contaFinalizada } = action.payload; // Assume que a action tem esta info
                 if (contaFinalizada) {
                     const vendasPorProduto = contaFinalizada.pedidos.reduce((acc, pedido) => {
                         acc[pedido.produtoId] = (acc[pedido.produtoId] || 0) + pedido.qtd;
                         return acc;
                     }, {});
                     this.#state.inventario.forEach(produto => {
                         if (vendasPorProduto[produto.id]) {
                             Storage.salvarItem('inventario', produto);
                         }
                     });
                 }
                 break;
            }
            case 'ADD_EXPENSE':
                Storage.salvarItem('despesas', action.payload); break;
            case 'ARCHIVE_DAY': {
                 const { relatorio } = action.payload;
                 Storage.salvarItem('historico', relatorio);
                 const { contasFechadasParaApagar, inventarioAtualizado } = gerarEstadoAposArquivo(prevState); // Usa prevState
                 contasFechadasParaApagar.forEach(c => Storage.apagarItem('contas', c.id));
                 inventarioAtualizado.forEach(p => Storage.salvarItem('inventario', p));
                 break;
            }
        }
    }
}

// Combina todos os slice reducers numa única rootReducer
const rootReducer = combineReducers({
    // Mapeia cada fatia do estado ao seu respectivo reducer
    inventario: inventarioReducer,
    clientes: clientesReducer,
    tagsDeCliente: tagsDeClienteReducer,
    contasAtivas: atendimentoReducer,
    despesas: despesasReducer,
    historicoFechos: historicoFechosReducer,
    config: configReducer,
    fornecedores: fornecedoresReducer,
    historicoCompras: historicoComprasReducer,
    categoriasDeProduto: categoriasDeProdutoReducer
});

// Cria a instância final do Store
const finalStore = new Store(rootReducer, initialState);

// Função para carregar o estado inicial do Storage (inalterada, mas validada)
export async function carregarEstadoInicial() {
    try {
        await Storage.initDB();
        let [
            inventario, contas, historico, clientes, despesas, configArray,
            fornecedores, historicoCompras, categoriasDeProduto, tagsDeCliente
        ] = await Promise.all([
            Storage.carregarTodos('inventario'), Storage.carregarTodos('contas'),
            Storage.carregarTodos('historico'), Storage.carregarTodos('clientes'),
            Storage.carregarTodos('despesas'), Storage.carregarTodos('config'),
            Storage.carregarTodos('fornecedores'), Storage.carregarTodos('historicoCompras'),
            Storage.carregarTodos('categoriasDeProduto'), Storage.carregarTodos('tagsDeCliente')
        ]);

        // Lógica de criação de categorias padrão (inalterada)
        if (categoriasDeProduto.length === 0) {
            console.log("Nenhuma categoria encontrada. A criar categorias padrão...");
            const categoriaAlcool = { id: 'sys_alcool', nome: "Alcool", parentId: null, isSystemDefault: true, cor: '#F59E0B' };
            const categoriaSemAlcool = { id: 'sys_sem_alcool', nome: "Sem Alcool", parentId: null, isSystemDefault: true, cor: '#3B82F6' };
            const subCategoriasPadrao = [
                { id: crypto.randomUUID(), nome: 'Cerveja', parentId: categoriaAlcool.id, isSystemDefault: false, cor: '#FBBF24' },
                { id: crypto.randomUUID(), nome: 'Vinho', parentId: categoriaAlcool.id, isSystemDefault: false, cor: '#8B5CF6' },
                { id: crypto.randomUUID(), nome: 'Whisky', parentId: categoriaAlcool.id, isSystemDefault: false, cor: '#A16207' },
                { id: crypto.randomUUID(), nome: 'Gin', parentId: categoriaAlcool.id, isSystemDefault: false, cor: '#10B981'},
                { id: crypto.randomUUID(), nome: 'Vodka', parentId: categoriaAlcool.id, isSystemDefault: false, cor: '#6366F1'},
                { id: crypto.randomUUID(), nome: 'Champanhe', parentId: categoriaAlcool.id, isSystemDefault: false, cor: '#FDE047'},
                { id: crypto.randomUUID(), nome: 'Refrigerante', parentId: categoriaSemAlcool.id, isSystemDefault: false, cor: '#EF4444' },
                { id: crypto.randomUUID(), nome: 'Sumo', parentId: categoriaSemAlcool.id, isSystemDefault: false, cor: '#F97316' },
                { id: crypto.randomUUID(), nome: 'Água', parentId: categoriaSemAlcool.id, isSystemDefault: false, cor: '#0EA5E9' },
                { id: crypto.randomUUID(), nome: 'Energético', parentId: categoriaSemAlcool.id, isSystemDefault: false, cor: '#D946EF' },
            ];
            const todasCategoriasDefault = [categoriaAlcool, categoriaSemAlcool, ...subCategoriasPadrao];
            await Promise.all(todasCategoriasDefault.map(cat => Storage.salvarItem('categoriasDeProduto', cat)));
            categoriasDeProduto = todasCategoriasDefault;
        }

        // Lógica de carregamento de produtos padrão (inalterada)
        if (inventario.length === 0) {
            try {
                console.log("Inventário vazio. A carregar produtos padrão...");
                const response = await fetch('./produtos-padrao-ao.json');
                if (response.ok) {
                    const produtosPadrao = await response.json();
                    const subcategoriasExistentes = categoriasDeProduto.filter(c => !c.isSystemDefault).map(c => c.nome.toLowerCase());
                    const inventarioInicial = produtosPadrao.map(p => {
                        const tagValida = p.tags && subcategoriasExistentes.includes(p.tags[0]) ? p.tags[0] : 'outros'; // Usa 'outros' como fallback
                        return { id: crypto.randomUUID(), stockLoja: 0, stockArmazem: 0, custoUnitario: 0, ultimaVenda: null, ...p, tags: [tagValida] };
                    });
                    await Promise.all(inventarioInicial.map(p => Storage.salvarItem('inventario', p)));
                    inventario = inventarioInicial;
                    console.log(`${inventario.length} produtos padrão carregados.`);
                }
            } catch (e) { console.error("Falha ao carregar produtos padrão:", e); }
        }

        const dbConfig = configArray.find(item => item.key === 'appConfig') || {};
        const payload = {
            inventario, contasAtivas: contas, historicoFechos: historico, clientes, despesas,
            config: dbConfig, fornecedores, historicoCompras, categoriasDeProduto, tagsDeCliente
        };

        finalStore.dispatch({ type: 'SET_INITIAL_STATE', payload });

    } catch (error) {
        console.error('Erro crítico ao carregar estado para o Store:', error);
        throw new Error('Não foi possível carregar os dados da aplicação.');
    }
}

export default finalStore;
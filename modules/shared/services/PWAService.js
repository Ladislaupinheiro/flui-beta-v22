// /modules/shared/services/PWAService.js (ATUALIZADO COM WEB SHARE API)
'use strict';

import store from './Store.js';
import { countLowStockItems } from '../../features/inventario/services/ProductAnalyticsService.js';

let isBadgeApiSupported = false;
let isNotificationApiSupported = false;
let isShareApiSupported = false;

/**
 * Verifica o suporte das APIs PWA no navegador.
 */
function checkSupport() {
    if ('setAppBadge' in navigator && 'clearAppBadge' in navigator) {
        isBadgeApiSupported = true;
        console.log('[PWAService] Badging API é suportada.');
    } else {
        console.log('[PWAService] Badging API não é suportada.');
    }

    if ('Notification' in window && 'serviceWorker' in navigator) {
        isNotificationApiSupported = true;
        console.log('[PWAService] Notifications API é suportada.');
    } else {
        console.log('[PWAService] Notifications API não é suportada.');
    }

    if (navigator.share && navigator.canShare) {
        isShareApiSupported = true;
        console.log('[PWAService] Web Share API é suportada.');
    } else {
        console.log('[PWAService] Web Share API não é suportada.');
    }
}

/**
 * Atualiza o badge do ícone da aplicação com base no número de itens em stock baixo.
 */
function updateAppBadge() {
    if (!isBadgeApiSupported) return;
    try {
        const lowStockCount = countLowStockItems(store.getState());
        if (lowStockCount > 0) {
            navigator.setAppBadge(lowStockCount);
        } else {
            navigator.clearAppBadge();
        }
    } catch (error) {
        console.error('[PWAService] Erro ao tentar atualizar o badge:', error);
    }
}

/**
 * Exibe uma notificação local através do Service Worker.
 * @param {string} title - O título da notificação.
 * @param {object} options - As opções da notificação (ex: body, icon).
 */
export async function showLocalNotification(title, options = {}) {
    if (!isNotificationApiSupported) return;

    let permissionGranted = Notification.permission === 'granted';
    if (Notification.permission === 'default') {
        const permission = await Notification.requestPermission();
        permissionGranted = permission === 'granted';
    }

    if (permissionGranted) {
        try {
            const reg = await navigator.serviceWorker.ready;
            const finalOptions = {
                icon: './icons/logo-small-192.png',
                badge: './favicon.png',
                ...options
            };
            reg.showNotification(title, finalOptions);
        } catch (error) {
            console.error('[PWAService] Erro ao exibir notificação:', error);
        }
    }
}

/**
 * Tenta partilhar ficheiros usando a Web Share API nativa.
 * Retorna true se a partilha foi iniciada com sucesso, false caso contrário.
 * @param {File[]} files - Um array de objetos File a serem partilhados.
 * @param {object} shareData - Contém título e texto para a partilha.
 * @param {string} shareData.title - O título da partilha.
 * @param {string} shareData.text - O texto descritivo.
 * @returns {Promise<boolean>}
 */
export async function shareFiles(files, { title, text }) {
    if (!isShareApiSupported || !navigator.canShare({ files })) {
        console.log('[PWAService] Partilha de ficheiros não suportada ou tipo de ficheiro inválido.');
        return false;
    }

    try {
        await navigator.share({
            files,
            title,
            text,
        });
        console.log('[PWAService] Ficheiro partilhado com sucesso.');
        return true;
    } catch (error) {
        // O erro AbortError é comum (utilizador cancelou a partilha) e não deve ser tratado como um erro crítico.
        if (error.name !== 'AbortError') {
            console.error('[PWAService] Erro ao partilhar:', error);
        } else {
            console.log('[PWAService] Partilha cancelada pelo utilizador.');
        }
        return false; // Retorna false se o utilizador cancelar
    }
}

/**
 * Inicializa o serviço PWA.
 */
export function init() {
    checkSupport();
    updateAppBadge();
    store.subscribe(updateAppBadge);
}

export default {
    init,
    showLocalNotification,
    shareFiles // Exporta a nova função
};
// craftraito/frontend/js/main.js
// ADICIONADO: Lógica para controlar o menu hambúrguer mobile.
import { initInsertView } from './views/insertView.js';
import { initCalculateView } from './views/calculateView.js';
import { initEditView } from './views/editView.js';
import * as ui from './ui.js';

// Guarda referências aos elementos das páginas e botões de navegação
const pages = {
    'page-insert': document.getElementById('page-insert'),
    'page-calculate': document.getElementById('page-calculate'),
    'page-edit': document.getElementById('page-edit')
};
const navButtons = document.querySelectorAll('#main-nav button[data-page]');
const globalStatusElementId = 'global-status-message';

// *** NOVO: Elementos do Menu Mobile ***
const hamburgerButton = document.getElementById('hamburger-button');
const mainNav = document.getElementById('main-nav');

let currentView = null;

/**
 * Função principal de inicialização da aplicação.
 */
function initializeApp() {
    console.log("Inicializando Aplicação...");
    ui.showStatusMessage(globalStatusElementId, 'Aplicação carregada.', 'info');

    // Adiciona listeners aos botões de navegação PRINCIPAIS
    navButtons.forEach(button => {
        button.addEventListener('click', () => {
            const pageId = button.getAttribute('data-page');
            navigateTo(pageId);
            // *** NOVO: Fecha o menu mobile ao clicar em um item ***
            if (mainNav.classList.contains('mobile-menu-open')) {
                toggleMobileMenu();
            }
        });
    });

    // *** NOVO: Adiciona listener ao botão hambúrguer ***
    if (hamburgerButton && mainNav) {
        hamburgerButton.addEventListener('click', toggleMobileMenu);
    } else {
        console.warn("Botão hambúrguer ou painel de navegação não encontrados.");
    }

    const initialPage = 'page-calculate';
    navigateTo(initialPage);
    const initialButton = document.querySelector(`#main-nav button[data-page='${initialPage}']`);
    if (initialButton) {
        initialButton.classList.add('active');
    }
}

/**
 * Navega para uma página/view específica.
 * @param {string} pageId - O ID da div da página a ser exibida.
 */
function navigateTo(pageId) {
    console.log(`Navegando para: ${pageId}`);
    if (currentView === pageId && document.getElementById(pageId)?.style.display === 'block') {
         console.log(`Já está na view: ${pageId}`);
         // Recarrega dados da view se necessário ao re-navegar para ela
         if (pageId === 'page-edit') initEditView();
         if (pageId === 'page-calculate') initCalculateView();
         return;
    }

    Object.values(pages).forEach(page => {
        if (page) page.style.display = 'none';
    });
    navButtons.forEach(button => button.classList.remove('active'));

    const targetPage = pages[pageId];
    if (targetPage) {
        targetPage.style.display = 'block';
        currentView = pageId;
        const activeButton = document.querySelector(`#main-nav button[data-page='${pageId}']`);
          if (activeButton) {
            activeButton.classList.add('active');
          }

        try {
            switch (pageId) {
                case 'page-insert': initInsertView(); break;
                case 'page-calculate': initCalculateView(); break;
                case 'page-edit': initEditView(); break;
                default: console.warn(`Nenhuma ação definida para: ${pageId}`);
            }
             ui.showStatusMessage(globalStatusElementId, `View "${pageId.replace('page-', '')}" carregada.`, 'info');
        } catch (error) {
             console.error(`Erro ao inicializar view ${pageId}:`, error);
             ui.showStatusMessage(globalStatusElementId, `Erro ao carregar view ${pageId}.`, 'error');
        }
    } else {
        console.error(`Página com ID "${pageId}" não encontrada.`);
        ui.showStatusMessage(globalStatusElementId, `Erro: View ${pageId} não encontrada.`, 'error');
    }
}

// *** NOVA FUNÇÃO: Controla a abertura/fechamento do menu mobile ***
function toggleMobileMenu() {
    if (!mainNav || !hamburgerButton) return;

    const isOpen = mainNav.classList.contains('mobile-menu-open');
    mainNav.classList.toggle('mobile-menu-open');
    hamburgerButton.classList.toggle('active'); // Para animar o ícone
    hamburgerButton.setAttribute('aria-expanded', !isOpen); // Atualiza acessibilidade
}

document.addEventListener('DOMContentLoaded', initializeApp);
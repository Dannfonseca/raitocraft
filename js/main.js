// craftraito/frontend/js/main.js
// ADICIONADO: Lógica para Dark Mode Toggle e localStorage.
import { initInsertView } from './views/insertView.js';
import { initCalculateView } from './views/calculateView.js';
import { initEditView } from './views/editView.js';
import * as ui from './ui.js';

const pages = { /* ... */
    'page-insert': document.getElementById('page-insert'),
    'page-calculate': document.getElementById('page-calculate'),
    'page-edit': document.getElementById('page-edit')
};
const navButtons = document.querySelectorAll('#main-nav button[data-page]');
const globalStatusElementId = 'global-status-message';
const hamburgerButton = document.getElementById('hamburger-button');
const mainNav = document.getElementById('main-nav');

// *** NOVO: Elemento do Dark Mode Toggle ***
const darkModeToggleButton = document.getElementById('dark-mode-toggle');

let currentView = null;

// *** NOVA FUNÇÃO: Aplica o tema (light ou dark) ***
function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('themePreference', theme); // Salva preferência
    // Atualiza ícone/texto do botão (Exemplo com texto/emoji)
    if (darkModeToggleButton) {
        darkModeToggleButton.textContent = theme === 'dark' ? '☀️' : '🌙';
        darkModeToggleButton.title = theme === 'dark' ? 'Mudar para tema claro' : 'Mudar para tema escuro';
    }
}

// *** NOVA FUNÇÃO: Alterna entre os temas ***
function toggleTheme() {
    const currentTheme = localStorage.getItem('themePreference') || // Pega preferência salva
                         // Ou verifica preferência do sistema operacional
                         (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    applyTheme(newTheme);
}

// *** NOVA FUNÇÃO: Carrega o tema salvo ao iniciar ***
function loadInitialTheme() {
    const savedTheme = localStorage.getItem('themePreference');
    // Define tema preferido do OS como padrão se não houver nada salvo
    const defaultTheme = (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    applyTheme(savedTheme || defaultTheme); // Aplica tema salvo ou padrão
}


/**
 * Função principal de inicialização da aplicação.
 */
function initializeApp() {
    console.log("Inicializando Aplicação...");
    ui.showStatusMessage(globalStatusElementId, 'Aplicação carregada.', 'info');

    // *** NOVO: Carrega tema inicial ***
    loadInitialTheme();

    // Listeners botões de navegação
    navButtons.forEach(button => {
        button.addEventListener('click', () => {
            const pageId = button.getAttribute('data-page');
            navigateTo(pageId);
            if (mainNav && mainNav.classList.contains('mobile-menu-open')) { // Verifica se mainNav existe
                toggleMobileMenu();
            }
        });
    });

    // Listener botão hambúrguer
    if (hamburgerButton && mainNav) {
        hamburgerButton.addEventListener('click', toggleMobileMenu);
    } else {
        console.warn("Botão hambúrguer ou painel de navegação não encontrados.");
    }

    // *** NOVO: Listener botão Dark Mode ***
    if (darkModeToggleButton) {
        darkModeToggleButton.addEventListener('click', toggleTheme);
    } else {
        console.warn("Botão Dark Mode Toggle não encontrado.");
    }

    // Navegação inicial
    const initialPage = 'page-calculate';
    navigateTo(initialPage);
    const initialButton = document.querySelector(`#main-nav button[data-page='${initialPage}']`);
    if (initialButton) {
        initialButton.classList.add('active');
    }
}

// --- navigateTo e toggleMobileMenu (sem mudanças) ---
function navigateTo(pageId) { /* ... (código igual anterior) ... */
    console.log(`Navegando para: ${pageId}`);
    if (currentView === pageId && document.getElementById(pageId)?.style.display === 'block') {
         console.log(`Já está na view: ${pageId}`);
         if (pageId === 'page-edit') initEditView();
         if (pageId === 'page-calculate') initCalculateView();
         return;
    }
    Object.values(pages).forEach(page => { if (page) page.style.display = 'none'; });
    navButtons.forEach(button => button.classList.remove('active'));
    const targetPage = pages[pageId];
    if (targetPage) {
        targetPage.style.display = 'block'; currentView = pageId;
        const activeButton = document.querySelector(`#main-nav button[data-page='${pageId}']`);
          if (activeButton) { activeButton.classList.add('active'); }
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
function toggleMobileMenu() { /* ... (código igual anterior) ... */
    if (!mainNav || !hamburgerButton) return;
    const isOpen = mainNav.classList.contains('mobile-menu-open');
    mainNav.classList.toggle('mobile-menu-open');
    hamburgerButton.classList.toggle('active');
    hamburgerButton.setAttribute('aria-expanded', !isOpen);
}

document.addEventListener('DOMContentLoaded', initializeApp);
// craftraito/frontend/js/main.js
// ADICIONADO: Lógica para Dark Mode Toggle e localStorage.
// ADICIONADO: Lógica para ocultar/mostrar header ao rolar e navegação por swipe em mobile.
// ATUALIZADO: Navegação por swipe agora com transições animadas.
import { initInsertView } from './views/insertView.js';
import { initCalculateView } from './views/calculateView.js';
import { initEditView } from './views/editView.js';
import * as ui from './ui.js';

const pages = {
    'page-insert': document.getElementById('page-insert'),
    'page-calculate': document.getElementById('page-calculate'),
    'page-edit': document.getElementById('page-edit')
};
const navButtons = document.querySelectorAll('#main-nav button[data-page]');
const mainNavButtonsArray = Array.from(navButtons);
const globalStatusElementId = 'global-status-message';
const hamburgerButton = document.getElementById('hamburger-button');
const mainNav = document.getElementById('main-nav');
const mainHeader = document.querySelector('.main-header');
const mainContainer = document.querySelector('main.container');

const darkModeToggleButton = document.getElementById('dark-mode-toggle');

let currentView = null;
let currentPageId = null;
let isAnimating = false; // Flag para prevenir múltiplas animações simultâneas

let lastScrollTop = 0;
const scrollDelta = 5;

let touchStartX = 0;
let touchStartY = 0;
let touchEndX = 0;
let touchEndY = 0;
const swipeThreshold = 50;

function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('themePreference', theme);
    if (darkModeToggleButton) {
        darkModeToggleButton.textContent = theme === 'dark' ? '☀️' : '🌙';
        darkModeToggleButton.title = theme === 'dark' ? 'Mudar para tema claro' : 'Mudar para tema escuro';
    }
}

function toggleTheme() {
    const currentTheme = localStorage.getItem('themePreference') ||
                         (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    applyTheme(newTheme);
}

function loadInitialTheme() {
    const savedTheme = localStorage.getItem('themePreference');
    const defaultTheme = (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    applyTheme(savedTheme || defaultTheme);
}

function handleScroll() {
    if (!mainHeader) return;
    const st = window.pageYOffset || document.documentElement.scrollTop;

    if (Math.abs(lastScrollTop - st) <= scrollDelta) return;

    if (st > lastScrollTop && st > mainHeader.offsetHeight) {
        mainHeader.classList.add('header-hidden');
    } else {
        mainHeader.classList.remove('header-hidden');
    }
    lastScrollTop = st <= 0 ? 0 : st;
}

function handleTouchStart(event) {
    if (isAnimating) return;
    touchStartX = event.changedTouches[0].screenX;
    touchStartY = event.changedTouches[0].screenY;
}

function handleTouchEnd(event) {
    if (isAnimating) return;
    touchEndX = event.changedTouches[0].screenX;
    touchEndY = event.changedTouches[0].screenY;
    handleSwipeGesture();
}

function handleSwipeGesture() {
    const deltaX = touchEndX - touchStartX;
    const deltaY = touchEndY - touchStartY;

    if (Math.abs(deltaX) > swipeThreshold && Math.abs(deltaY) < swipeThreshold) {
        const currentButton = document.querySelector(`#main-nav button[data-page='${currentPageId || currentView}'].active`);
        if (!currentButton) return;

        const currentIndex = mainNavButtonsArray.indexOf(currentButton);
        let nextIndex;
        let direction;

        if (deltaX < 0) { // Swipe para a esquerda (mostrar próximo item, que vem da direita)
            nextIndex = (currentIndex + 1) % mainNavButtonsArray.length;
            direction = 'left'; // Próxima página vem da direita
        } else { // Swipe para a direita (mostrar item anterior, que vem da esquerda)
            nextIndex = (currentIndex - 1 + mainNavButtonsArray.length) % mainNavButtonsArray.length;
            direction = 'right'; // Página anterior vem da esquerda
        }

        const nextPageIdToNavigate = mainNavButtonsArray[nextIndex].getAttribute('data-page');
        if (nextPageIdToNavigate && nextPageIdToNavigate !== (currentPageId || currentView)) {
            navigateTo(nextPageIdToNavigate, direction);
        }
    }
}

function initializeApp() {
    console.log("Inicializando Aplicação...");
    ui.showStatusMessage(globalStatusElementId, 'Aplicação carregada.', 'info');
    loadInitialTheme();

    navButtons.forEach(button => {
        button.addEventListener('click', () => {
            if (isAnimating) return;
            const pageId = button.getAttribute('data-page');
            navigateTo(pageId); // Navegação por botão não tem direção de swipe, usará fade padrão
            if (mainNav && mainNav.classList.contains('mobile-menu-open')) {
                toggleMobileMenu();
            }
        });
    });

    if (hamburgerButton && mainNav) hamburgerButton.addEventListener('click', toggleMobileMenu);
    if (darkModeToggleButton) darkModeToggleButton.addEventListener('click', toggleTheme);
    window.addEventListener('scroll', handleScroll);

    if (mainContainer) {
        mainContainer.addEventListener('touchstart', handleTouchStart, { passive: true });
        mainContainer.addEventListener('touchend', handleTouchEnd, { passive: true });
    }

    const initialPage = 'page-calculate';
    navigateTo(initialPage, null, true); // true para isInitialLoad
}


function navigateTo(nextPageId, swipeDirection = null, isInitialLoad = false) {
    if (isAnimating && !isInitialLoad) {
        console.warn("Animação em progresso, navegação ignorada.");
        return;
    }
    if (currentPageId === nextPageId && !isInitialLoad) {
        console.log(`Já está na view: ${nextPageId}`);
        // Re-inicializar a view se necessário ou apenas retornar
        if (nextPageId === 'page-edit') initEditView();
        if (nextPageId === 'page-calculate') initCalculateView();
        return;
    }

    isAnimating = true;

    const currentPageElement = currentPageId ? pages[currentPageId] : null;
    const nextPageElement = pages[nextPageId];

    if (!nextPageElement) {
        console.error(`Página com ID "${nextPageId}" não encontrada.`);
        ui.showStatusMessage(globalStatusElementId, `Erro: View ${nextPageId} não encontrada.`, 'error');
        isAnimating = false;
        return;
    }

    // Limpa classes de animação anteriores de todas as páginas
    Object.values(pages).forEach(p => {
        if(p) p.className = 'page-view';
    });
    
    // Ativa o botão da navegação
    navButtons.forEach(button => button.classList.remove('active'));
    const activeButton = document.querySelector(`#main-nav button[data-page='${nextPageId}']`);
    if (activeButton) activeButton.classList.add('active');

    // Prepara a próxima página para ser visível para animação
    nextPageElement.style.display = 'block';


    if (isInitialLoad) {
        nextPageElement.classList.add('page-active');
        // Não há página atual para animar a saída
    } else if (currentPageElement && swipeDirection) {
        // Animação de Swipe
        if (swipeDirection === 'left') { // Swiped left, new page comes from right
            currentPageElement.classList.add('page-leave-to-left');
            nextPageElement.classList.add('page-enter-from-right');
        } else { // Swiped right, new page comes from left
            currentPageElement.classList.add('page-leave-to-right');
            nextPageElement.classList.add('page-enter-from-left');
        }
        
        requestAnimationFrame(() => {
            nextPageElement.classList.add('page-animating');
            currentPageElement.classList.add('page-animating');
            requestAnimationFrame(() => {
                nextPageElement.classList.add('page-active');
                if (swipeDirection === 'left') {
                    currentPageElement.classList.remove('page-active');
                } else {
                    currentPageElement.classList.remove('page-active');
                }
            });
        });

    } else if (currentPageElement) { // Navegação por clique ou sem swipe (fade)
        currentPageElement.classList.add('page-fade-out');
        nextPageElement.classList.add('page-fade-in-prepare');
        
        requestAnimationFrame(() => {
            nextPageElement.classList.add('page-animating');
            currentPageElement.classList.add('page-animating'); // Para a transição de opacidade
             requestAnimationFrame(() => {
                nextPageElement.classList.add('page-active');
                currentPageElement.classList.remove('page-active');
             });
        });
    }


    const animationDuration = 300; // Deve corresponder à duração da animação no CSS

    setTimeout(() => {
        if (currentPageElement && !isInitialLoad) {
            currentPageElement.style.display = 'none';
            currentPageElement.className = 'page-view'; // Limpa classes
        }
        nextPageElement.className = 'page-view page-active'; // Garante estado final
        
        currentPageId = nextPageId;
        currentView = nextPageId; // Mantendo currentView para compatibilidade se usado em outro lugar

        try {
            switch (nextPageId) {
                case 'page-insert': initInsertView(); break;
                case 'page-calculate': initCalculateView(); break;
                case 'page-edit': initEditView(); break;
                default: console.warn(`Nenhuma ação definida para: ${nextPageId}`);
            }
            ui.showStatusMessage(globalStatusElementId, `View "${nextPageId.replace('page-', '')}" carregada.`, 'info');
        } catch (error) {
            console.error(`Erro ao inicializar view ${nextPageId}:`, error);
            ui.showStatusMessage(globalStatusElementId, `Erro ao carregar view ${nextPageId}.`, 'error');
        }
        isAnimating = false;
    }, animationDuration);
}


function toggleMobileMenu() {
    if (!mainNav || !hamburgerButton) return;
    const isOpen = mainNav.classList.contains('mobile-menu-open');
    mainNav.classList.toggle('mobile-menu-open');
    hamburgerButton.classList.toggle('active');
    hamburgerButton.setAttribute('aria-expanded', String(!isOpen));
}

document.addEventListener('DOMContentLoaded', initializeApp);
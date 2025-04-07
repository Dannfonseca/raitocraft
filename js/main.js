// Importa as funções de inicialização das views
import { initInsertView } from './views/insertView.js';
import { initCalculateView } from './views/calculateView.js';
import { initEditView } from './views/editView.js';
import * as ui from './ui.js'; // Para status global se necessário

// Guarda referências aos elementos das páginas e botões de navegação
const pages = {
    'page-insert': document.getElementById('page-insert'),
    'page-calculate': document.getElementById('page-calculate'),
    'page-edit': document.getElementById('page-edit')
};
const navButtons = document.querySelectorAll('#main-nav button[data-page]');
// Define o ID do elemento para mensagens de status globais
const globalStatusElementId = 'global-status-message'; // <<< Linha adicionada/corrigida

let currentView = null; // Guarda qual view está ativa

/**
 * Função principal de inicialização da aplicação.
 */
function initializeApp() {
    console.log("Inicializando Aplicação...");
    // Mostra mensagem inicial usando a variável agora definida
    ui.showStatusMessage(globalStatusElementId, 'Aplicação carregada.', 'info');

    // Adiciona listeners aos botões de navegação
    navButtons.forEach(button => {
        button.addEventListener('click', () => {
            const pageId = button.getAttribute('data-page');
            navigateTo(pageId);
        });
    });

    // Define a página inicial (pode ser a de cálculo ou inserção)
    const initialPage = 'page-calculate'; // Mude para 'page-insert' se preferir
    navigateTo(initialPage);
     // Adiciona classe 'active' ao botão inicial
     const initialButton = document.querySelector(`button[data-page='${initialPage}']`);
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
         // Se já está na view e ela está visível, talvez recarregar os dados dela?
         // Por exemplo, se voltar para 'page-edit', recarregar a lista.
         if (pageId === 'page-edit') initEditView();
         if (pageId === 'page-calculate') initCalculateView(); // Recarrega itens e reseta estado
         return; // Evita reprocessamento desnecessário se já estiver nela
    }

    // Esconde todas as páginas
    Object.values(pages).forEach(page => {
        if (page) page.style.display = 'none';
    });

    // Remove a classe 'active' de todos os botões de navegação
    navButtons.forEach(button => button.classList.remove('active'));


    // Mostra a página selecionada
    const targetPage = pages[pageId];
    if (targetPage) {
        targetPage.style.display = 'block';
        currentView = pageId;

         // Adiciona classe 'active' ao botão correspondente
         const activeButton = document.querySelector(`button[data-page='${pageId}']`);
          if (activeButton) {
            activeButton.classList.add('active');
          }


        // Inicializa a view correspondente ou atualiza seus dados
        // Chamamos a inicialização toda vez para garantir que os dados estejam frescos
        // ou que os listeners sejam corretamente anexados (importante se o DOM for manipulado extensivamente)
        try {
            switch (pageId) {
                case 'page-insert':
                    initInsertView();
                    break;
                case 'page-calculate':
                    initCalculateView();
                    break;
                case 'page-edit':
                    initEditView();
                    break;
                default:
                    console.warn(`Nenhuma ação de inicialização definida para a página: ${pageId}`);
            }
            // Mostra status de sucesso apenas se a inicialização não lançar erro (idealmente)
             ui.showStatusMessage(globalStatusElementId, `View "${pageId.replace('page-', '')}" carregada.`, 'info');

        } catch (error) {
             console.error(`Erro ao inicializar a view ${pageId}:`, error);
              ui.showStatusMessage(globalStatusElementId, `Erro ao carregar view ${pageId}. Verifique o console.`, 'error');
        }

    } else {
        console.error(`Página com ID "${pageId}" não encontrada.`);
         ui.showStatusMessage(globalStatusElementId, `Erro: View ${pageId} não encontrada.`, 'error');
    }
}

// Espera o DOM carregar para iniciar a aplicação
document.addEventListener('DOMContentLoaded', initializeApp);
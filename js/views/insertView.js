import * as api from '../apiService.js';
import * as ui from '../ui.js';

let insertForm = null;
let materialsContainer = null;
let statusElementId = 'insert-status';

/**
 * Inicializa a view de inserção, configura listeners.
 */
export function initInsertView() {
    console.log("Inicializando Insert View...");
    insertForm = document.getElementById('insert-form');
    materialsContainer = document.getElementById('insert-materials-container');
    const addMaterialButton = document.getElementById('add-material-button');

    if (!insertForm || !materialsContainer || !addMaterialButton) {
        console.error("Elementos essenciais da Insert View não encontrados.");
        return;
    }

    // Limpa o formulário ao inicializar
    resetInsertForm();

    // Listener para adicionar campo de material
    addMaterialButton.addEventListener('click', () => {
        ui.addMaterialInput(materialsContainer);
    });

    // Listener para submeter o formulário
    insertForm.addEventListener('submit', handleInsertSubmit);

     // Adiciona um campo de material inicial por padrão se o container estiver vazio
     if (!materialsContainer.hasChildNodes()) {
        ui.addMaterialInput(materialsContainer);
     }
}

/**
 * Lida com a submissão do formulário de inserção.
 * @param {Event} event - O evento de submit.
 */
async function handleInsertSubmit(event) {
    event.preventDefault();
    ui.showStatusMessage(statusElementId, 'Salvando receita...', 'loading');

    const formData = new FormData(insertForm);
    const materials = ui.getMaterialsData(materialsContainer); // Coleta e valida materiais

    // Verifica se a coleta de materiais retornou null (erro de validação)
    if (materials === null) {
         ui.showStatusMessage(statusElementId, 'Erro: Verifique os dados dos materiais inseridos.', 'error');
         return; // Interrompe se houver erro nos materiais
    }

    const recipeData = {
        name: formData.get('name')?.trim(),
        quantity_produced: parseInt(formData.get('quantity_produced'), 10),
        npc_sell_price: parseInt(formData.get('npc_sell_price'), 10) || 0,
        materials: materials
    };


    // Validação dos dados principais
    if (!recipeData.name || !recipeData.quantity_produced || recipeData.quantity_produced <= 0) {
        ui.showStatusMessage(statusElementId, 'Erro: Nome e Quantidade Produzida (> 0) são obrigatórios.', 'error');
        return;
    }
    if (recipeData.materials.length === 0) {
         ui.showStatusMessage(statusElementId, 'Erro: Adicione pelo menos um material.', 'error');
         return;
    }

    try {
        const result = await api.createItem(recipeData);
        ui.showStatusMessage(statusElementId, `Sucesso! Receita "${recipeData.name}" salva com ID: ${result.id}.`, 'success');
        resetInsertForm();
    } catch (error) {
        console.error("Erro ao salvar receita:", error);
        // Tenta mostrar a mensagem de erro vinda da API, senão uma genérica
        const errorMessage = error.message || "Ocorreu um erro desconhecido.";
        ui.showStatusMessage(statusElementId, `Erro ao salvar: ${errorMessage}`, 'error');
    }
}

/**
 * Limpa o formulário de inserção e a lista de materiais.
 */
function resetInsertForm() {
    if (insertForm) {
        insertForm.reset();
    }
    if (materialsContainer) {
        materialsContainer.innerHTML = '';
        // Adiciona um campo inicial após limpar
        ui.addMaterialInput(materialsContainer);
    }
     // CORREÇÃO: Adiciona o prefixo 'ui.'
     ui.hideStatusMessage(statusElementId); // Esconde mensagens antigas
}
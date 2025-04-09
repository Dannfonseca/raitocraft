const API_BASE_URL = 'https://apipokecraft-production.up.railway.app/api'; // <<< ADICIONADO https:// e /api

/**
 * Função auxiliar para tratar respostas fetch
 * @param {Response} response - Objeto Response do fetch
 * @returns {Promise<any>} - Promessa que resolve com JSON ou rejeita com erro
 */
async function handleResponse(response) {
    const contentType = response.headers.get("content-type");
    let data;
    if (contentType && contentType.indexOf("application/json") !== -1) {
        data = await response.json();
    } else {
        // Tenta ler como texto se não for JSON (ex: mensagens simples do servidor)
        data = await response.text();
    }

    if (!response.ok) {
        // Tenta extrair mensagem de erro do JSON, senão usa status text
        const error = (data && data.error) || data || response.statusText;
        return Promise.reject(new Error(error));
    }
    return data;
}



/**
 * Busca a lista de todos os itens craftáveis (id, nome, preço npc).
 * @returns {Promise<Array<{id: number, name: string, npc_sell_price: number}>>}
 */
export async function fetchItems() {
    try {
        const response = await fetch(`${API_BASE_URL}/items`);
        return await handleResponse(response);
    } catch (error) {
        console.error("Erro ao buscar itens:", error);
        throw error;
    }
}

/**
 * Busca a receita detalhada de um item específico.
 * @param {number} itemId - O ID do item.
 * @returns {Promise<Object|null>} - Dados da receita ou null se não encontrado.
 */
export async function fetchRecipe(itemId) {
    if (!itemId) return Promise.resolve(null); // Resolve com null se ID for inválido
    try {
        const response = await fetch(`${API_BASE_URL}/items/${itemId}/recipe`);
         if (response.status === 404) {
             return null; // Item não encontrado pelo backend
         }
        return await handleResponse(response);
    } catch (error) {
        console.error(`Erro ao buscar receita para item ${itemId}:`, error);
        throw error;
    }
}

/**
 * Cria uma nova receita no backend.
 * @param {Object} recipeData - Dados da receita (formato esperado pelo POST /api/items).
 * @returns {Promise<Object>} - Resposta do servidor (ex: { message, id }).
 */
export async function createItem(recipeData) {
    try {
        const response = await fetch(`${API_BASE_URL}/items`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(recipeData),
        });
        return await handleResponse(response);
    } catch (error) {
        console.error("Erro ao criar item:", error);
        throw error;
    }
}

/**
 * Atualiza uma receita existente no backend.
 * @param {number} itemId - O ID do item a ser atualizado.
 * @param {Object} recipeData - Novos dados da receita.
 * @returns {Promise<Object>} - Resposta do servidor.
 */
export async function updateItem(itemId, recipeData) {
     if (!itemId) return Promise.reject(new Error("ID do item inválido para atualização."));
    try {
        const response = await fetch(`${API_BASE_URL}/items/${itemId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(recipeData),
        });
        return await handleResponse(response);
    } catch (error) {
        console.error(`Erro ao atualizar item ${itemId}:`, error);
        throw error;
    }
}

/**
 * Deleta uma receita do backend.
 * @param {number} itemId - O ID do item a ser deletado.
 * @returns {Promise<Object>} - Resposta do servidor.
 */
export async function deleteItem(itemId) {
     if (!itemId) return Promise.reject(new Error("ID do item inválido para deleção."));
    try {
        const response = await fetch(`${API_BASE_URL}/items/${itemId}`, {
            method: 'DELETE',
        });
        // DELETE pode retornar 200 OK com JSON ou 204 No Content sem corpo
        if (response.status === 204) {
             return { message: 'Receita deletada com sucesso!' }; // Simula resposta JSON
        }
        return await handleResponse(response);
    } catch (error) {
        console.error(`Erro ao deletar item ${itemId}:`, error);
        throw error;
    }
}
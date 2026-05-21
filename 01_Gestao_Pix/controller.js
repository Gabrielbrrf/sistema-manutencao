/* controller.js */
import { View } from './view.js';

const btnTabLista = document.getElementById('btn-tab-lista');
const btnTabCadastro = document.getElementById('btn-tab-cadastro');
const btnSalvar = document.getElementById('btn-salvar');
const inputBusca = document.getElementById('inputBusca');

// Carregar ao iniciar
document.addEventListener('DOMContentLoaded', carregarListaDoBanco);

btnTabLista.onclick = async () => {
    document.getElementById('aba-lista').classList.remove('hidden');
    document.getElementById('aba-cadastro').classList.add('hidden');
    btnTabLista.classList.add('active');
    btnTabCadastro.classList.remove('active');
    View.limparFormulario();
    await carregarListaDoBanco(); 
};

btnTabCadastro.onclick = () => {
    document.getElementById('aba-lista').classList.add('hidden');
    document.getElementById('aba-cadastro').classList.remove('hidden');
    btnTabLista.classList.remove('active');
    btnTabCadastro.classList.add('active');
};

inputBusca.onkeyup = async () => {
    const termo = inputBusca.value.toLowerCase();
    const { data } = await _supabase
        .from('contatos')
        .select('*')
        .ilike('nome', `%${termo}%`); 
    View.renderizarLista(data || []);
};

btnSalvar.onclick = async () => {
    const inputNome = document.getElementById('reg-nome');
    const idEditando = inputNome.getAttribute('data-id-editando');

    const dados = {
        nome: inputNome.value.trim(),
        chave_pix: document.getElementById('reg-pix').value.trim(),
        telefone: document.getElementById('reg-tel').value.trim(),
        banco: document.getElementById('reg-banco').value.trim(),
        cidade: document.getElementById('reg-cidade').value, 
        categoria: document.getElementById('reg-categoria').value
    };

    if (dados.nome && dados.chave_pix) {
        btnSalvar.disabled = true;
        btnSalvar.innerText = "Processando...";

        const { error } = idEditando 
            ? await _supabase.from('contatos').update(dados).eq('id', idEditando)
            : await _supabase.from('contatos').insert([dados]);

        if (!error) {
            alert(idEditando ? "Atualizado!" : "Cadastrado!");
            View.limparFormulario();
            btnTabLista.click(); 
        } else {
            alert("Erro ao salvar.");
        }
    } else {
        alert("Preencha Nome e PIX!");
    }
    btnSalvar.disabled = false;
};

async function carregarListaDoBanco() {
    const { data, error } = await _supabase
        .from('contatos')
        .select('*')
        .order('nome', { ascending: true });
    
    if (!error) View.renderizarLista(data || []);
}

window.editarColab = async (id) => {
    const { data } = await _supabase.from('contatos').select('*').eq('id', id).single();
    if (!data) return;

    document.getElementById('reg-nome').value = data.nome;
    document.getElementById('reg-pix').value = data.chave_pix;
    document.getElementById('reg-tel').value = data.telefone || "";
    document.getElementById('reg-banco').value = data.banco || "";
    document.getElementById('reg-cidade').value = data.cidade;
    document.getElementById('reg-categoria').value = data.categoria;

    document.getElementById('reg-nome').setAttribute('data-id-editando', data.id);
    btnSalvar.innerText = "ATUALIZAR DADOS";
    btnSalvar.style.background = "#f39c12";
    btnTabCadastro.click();
};

window.excluirColab = async (id, nome) => {
    if (confirm(`Deseja remover ${nome}?`)) {
        const { error } = await _supabase.from('contatos').delete().eq('id', id);
        if (!error) carregarListaDoBanco();
    }
};
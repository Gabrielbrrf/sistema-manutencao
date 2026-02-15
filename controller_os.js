/* controller_os.js */
let horaInicioReal = null;

const ManutencaoController = {
    async init() {
        try {
            const tecnicos = await ManutencaoModel.buscarTecnicos();
            ManutencaoView.renderizarTecnicos(tecnicos);

            const { data: ordens } = await ManutencaoModel.buscarTodasOS();
            ManutencaoView.renderizarLista(ordens || []);

            const agora = new Date();
            document.getElementById('dataOS').value = agora.toISOString().split('T')[0];
            document.getElementById('horaEstimadaOS').value = agora.toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'});
        } catch (e) {
            console.error("Erro no load:", e);
        }
    },

    async deletarOS(id) {
        if (confirm("Excluir permanentemente?")) {
            const { error } = await window._supabase.from('ordens_servico').delete().eq('id', id);
            if (!error) location.reload();
        }
    }
};

// BOTÃO INICIAR
document.getElementById('btnIniciarOS')?.addEventListener('click', () => {
    horaInicioReal = new Date().toISOString(); 
    document.getElementById('btnIniciarOS').style.display = 'none';
    document.getElementById('secaoFinanceiraOS').style.display = 'block';
    document.getElementById('btnGerarOS').style.display = 'block';
});

// BOTÃO SALVAR E FINALIZAR (CORRIGIDO)
document.getElementById('btnGerarOS')?.addEventListener('click', async () => {
    const btn = document.getElementById('btnGerarOS');
    btn.disabled = true;
    btn.innerText = "SALVANDO...";

    // 1. Pega o arquivo da NF (Usando o ID 'inputNF' que está no seu HTML)
    let urlNF = "";
    const inputNF = document.getElementById('inputNF'); 
    
    if (inputNF && inputNF.files && inputNF.files.length > 0) {
        urlNF = await ManutencaoModel.uploadNF(inputNF.files[0]);
    }

    // 2. Monta os dados exatamente como seu banco espera
    const dados = {
        cidade: document.getElementById('cidadeOS').value,
        tecnico: document.getElementById('tecnicoOS').value,
        endereco_condominio: document.getElementById('enderecoOS').value,
        apto: document.getElementById('aptoOS').value,
        descricao_servico: document.getElementById('servicoOS').value,
        hospede_no_apto: document.getElementById('hospedeStatusOS').value,
        data_execucao: document.getElementById('dataOS').value,
        hora_estimada: document.getElementById('horaEstimadaOS').value,
        hora_inicio: horaInicioReal || new Date().toISOString(),
        hora_conclusao: new Date().toISOString(),
        valor_mao_de_obra: parseFloat(document.getElementById('valorMaoObra').value) || 0,
        valor_materiais: parseFloat(document.getElementById('valorMateriais').value) || 0,
        url_nota_fiscal: urlNF,
        status: 'Concluido'
    };

    // 3. Salva no Banco
    const { error } = await ManutencaoModel.salvarNoBanco(dados);
    
    if (!error) {
        alert("✅ SERVIÇO SALVO COM SUCESSO!");
        location.reload();
    } else {
        alert("❌ ERRO NO BANCO: " + error.message);
        btn.disabled = false;
        btn.innerText = "TENTAR NOVAMENTE";
    }
});

window.addEventListener('load', () => ManutencaoController.init());
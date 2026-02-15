/* controller_os.js - Versão Final Otimizada */
let horaInicioReal = null;

const ManutencaoController = {
    async init() {
        try {
            // Carrega os técnicos (Israel/Will) do Model (tabela colaboradores)
            const tecnicos = await ManutencaoModel.buscarTecnicos();
            ManutencaoView.renderizarTecnicos(tecnicos);

            // Busca o histórico de ordens para mostrar na lista abaixo do form
            const { data: ordens } = await ManutencaoModel.buscarTodasOS();
            ManutencaoView.renderizarLista(ordens || []);

            // Preenche data e hora atual nos campos automáticos para facilitar pro técnico
            const agora = new Date();
            const campoData = document.getElementById('dataOS');
            const campoHora = document.getElementById('horaEstimadaOS');
            
            if (campoData) campoData.value = agora.toISOString().split('T')[0];
            if (campoHora) campoHora.value = agora.toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'});
            
        } catch (e) {
            console.error("Erro no carregamento inicial:", e);
        }
    },

    async deletarOS(id) {
        if (confirm("Deseja excluir permanentemente este registro?")) {
            const { error } = await window._supabase.from('ordens_servico').delete().eq('id', id);
            if (!error) {
                location.reload();
            } else {
                alert("Erro ao deletar: " + error.message);
            }
        }
    }
};

// EVENTO: BOTÃO INICIAR SERVIÇO (Libera os campos financeiros)
document.getElementById('btnIniciarOS')?.addEventListener('click', () => {
    horaInicioReal = new Date().toISOString(); 
    
    const btnIniciar = document.getElementById('btnIniciarOS');
    const secaoFin = document.getElementById('secaoFinanceiraOS');
    const btnGerar = document.getElementById('btnGerarOS');

    // Remove o botão Iniciar e mostra a parte de Financeiro/NF e Finalizar
    if (btnIniciar) btnIniciar.style.setProperty('display', 'none', 'important');
    if (secaoFin) secaoFin.style.setProperty('display', 'block', 'important');
    if (btnGerar) btnGerar.style.setProperty('display', 'block', 'important');
    
    console.log("OS Iniciada em: " + horaInicioReal);
});

// EVENTO: BOTÃO SALVAR E FINALIZAR (Envia tudo para o banco)
document.getElementById('btnGerarOS')?.addEventListener('click', async () => {
    const btn = document.getElementById('btnGerarOS');
    const tecnicoSelect = document.getElementById('tecnicoOS');

    if (!tecnicoSelect.value) {
        alert("Por favor, selecione o seu nome (Técnico)!");
        return;
    }

    btn.disabled = true;
    btn.innerText = "PROCESSANDO IMAGEM...";
    btn.style.background = "#95a5a6";

    try {
        let base64NF = "";
        const inputNF = document.getElementById('inputNF'); 
        
        // Converte a foto tirada em Base64 para salvar no banco
        if (inputNF && inputNF.files && inputNF.files.length > 0) {
            base64NF = await new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.readAsDataURL(inputNF.files[0]);
                reader.onload = () => resolve(reader.result);
                reader.onerror = (error) => reject(error);
            });
        }

        btn.innerText = "ENVIANDO AO BANCO...";

        const dados = {
            cidade: document.getElementById('cidadeOS')?.value || "",
            tecnico: tecnicoSelect.value,
            endereco_condominio: document.getElementById('enderecoOS')?.value || "",
            apto: document.getElementById('aptoOS')?.value || "",
            descricao_servico: document.getElementById('servicoOS')?.value || "",
            hospede_no_apto: document.getElementById('hospedeStatusOS')?.value || "Não informado",
            data_execucao: document.getElementById('dataOS')?.value || new Date().toISOString().split('T')[0],
            hora_estimada: document.getElementById('horaEstimadaOS')?.value || "",
            hora_inicio: horaInicioReal || new Date().toISOString(),
            hora_conclusao: new Date().toISOString(),
            valor_mao_de_obra: parseFloat(document.getElementById('valorMaoObra')?.value) || 0,
            valor_gasto: parseFloat(document.getElementById('valorMateriais')?.value) || 0,
            foto_nf: base64NF, 
            status: 'Concluido' // Isso faz a OS ficar VERDE na sua tela ADM
        };

        const { error } = await ManutencaoModel.salvarNoBanco(dados);
        
        if (!error) {
            alert("✅ SERVIÇO SALVO COM SUCESSO!");
            location.reload();
        } else {
            throw error;
        }

    } catch (err) {
        console.error("Erro ao salvar OS:", err);
        alert("❌ ERRO AO SALVAR: " + err.message);
        btn.disabled = false;
        btn.innerText = "TENTAR NOVAMENTE";
        btn.style.background = "#27ae60";
    }
});

// Inicialização automática
window.addEventListener('load', () => ManutencaoController.init());

import { ModelNF } from './model_nf.js';
import { ViewNF } from './view_nf.js';

const btnSalvar = document.getElementById('btn-salvar-nf');

// Salvar Nova Nota
if (btnSalvar) {
    btnSalvar.onclick = async () => {
        const file = document.getElementById('nf-file').files[0];
        if (!file) return alert("Anexe a Nota Fiscal!");

        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = async () => {
            const novaNota = {
                apto: document.getElementById('nf-apto').value,
                data: document.getElementById('nf-data').value,
                valor: parseFloat(document.getElementById('nf-valor').value) || 0,
                manutencao: document.getElementById('nf-manutencao').value,
                arquivo: reader.result // Base64
            };
            
            const { success, error } = await ModelNF.adicionarNota(novaNota);
            if (success) {
                alert("Nota salva no banco de dados!");
                location.reload();
            } else {
                alert("Erro ao salvar: " + error.message);
            }
        };
    };
}

// Global para abrir o documento (Busca no banco antes de abrir)
window.abrirDocumento = async (id) => {
    const notas = await ModelNF.listarNotas();
    const nota = notas.find(n => n.id == id);
    if (nota) ViewNF.mostrarModal(nota);
};

// Global para filtrar (Agora busca do Supabase)
window.filtrarMes = async (mes) => {
    const grid = document.getElementById('grid-nfs');
    grid.innerHTML = "<p>Carregando notas...</p>";
    
    const filtradas = await ModelNF.getNotasPorMes(mes);
    ViewNF.renderizarLista(filtradas);
};

window.deletarNota = async (id) => {
    if (confirm("Deseja apagar esta nota permanentemente?")) {
        const { success } = await ModelNF.excluirNota(id);
        if (success) {
            alert("Nota excluída!");
            location.reload();
        }
    }
};

// Fechar Modal
document.getElementById('close-modal')?.addEventListener('click', () => {
    document.getElementById('modal-nota').style.display = "none";
});
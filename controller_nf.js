import { ModelNF } from './model_nf.js';
import { ViewNF } from './view_nf.js';

const btnSalvar = document.getElementById('btn-salvar-nf');

if (btnSalvar) {
    btnSalvar.onclick = async () => {
        const file = document.getElementById('nf-file').files[0];
        if (!file) return alert("Anexe a Nota Fiscal!");

        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            const novaNota = {
                id: Date.now().toString(),
                apto: document.getElementById('nf-apto').value,
                data: document.getElementById('nf-data').value,
                valor: document.getElementById('nf-valor').value,
                manutencao: document.getElementById('nf-manutencao').value,
                arquivo: reader.result
            };
            ModelNF.adicionarNota(novaNota);
            alert("Nota salva!");
            location.reload();
        };
    };
}

window.abrirDocumento = (id) => {
    const nota = ModelNF.notas.find(n => n.id === id);
    if (nota) ViewNF.mostrarModal(nota);
};

window.filtrarMes = (mes) => {
    const filtradas = ModelNF.getNotasPorMes(mes);
    ViewNF.renderizarLista(filtradas);
};

window.deletarNota = (id) => {
    if (confirm("Deseja apagar esta nota?")) {
        ModelNF.excluirNota(id);
        alert("Nota excluída!");
        location.reload();
    }
};

const btnFechar = document.getElementById('close-modal');
if (btnFechar) {
    btnFechar.onclick = () => {
        const modal = document.getElementById('modal-nota');
        modal.style.display = "none";
        modal.classList.add('hidden');
    };
}
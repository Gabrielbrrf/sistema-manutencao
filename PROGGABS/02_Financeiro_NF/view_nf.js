export const ViewNF = {
    renderizarLista(notas) {
        const grid = document.getElementById('grid-nfs');
        grid.innerHTML = "";

        if (notas.length === 0) {
            grid.innerHTML = "<p>Nenhuma nota encontrada.</p>";
            return;
        }

        const total = notas.reduce((acc, nota) => acc + parseFloat(nota.valor || 0), 0);
        
        const resumo = document.createElement('div');
        resumo.className = "resumo-mes";
        resumo.innerHTML = `Total do Mês: R$ ${total.toLocaleString('pt-BR', {minimumFractionDigits: 2})}`;
        grid.appendChild(resumo);

        notas.forEach((nota) => {
            const card = document.createElement('div');
            card.className = 'nf-item';
            card.innerHTML = `
                <button class="btn-apto" onclick="window.abrirDocumento('${nota.id}')">
                    Apto ${nota.apto}
                </button>
                <div class="nf-detalhes">
                    <b>${nota.manutencao}</b>
                    <span>R$ ${nota.valor} - ${nota.data}</span>
                </div>
            `;
            grid.appendChild(card);
        });
    },

    mostrarModal(nota) {
        const modal = document.getElementById('modal-nota');
        const body = document.getElementById('modal-body');
        const titulo = document.getElementById('modal-titulo');

        titulo.innerText = `Apto ${nota.apto} - ${nota.manutencao}`;
        body.innerHTML = "";
        modal.style.display = "flex";
        modal.classList.remove('hidden');

        const preview = nota.arquivo.includes("pdf") 
            ? `<embed src="${nota.arquivo}" type="application/pdf" width="100%" height="450px">`
            : `<img src="${nota.arquivo}" style="max-width:100%; border-radius:8px; display:block; margin:auto;">`;

        body.innerHTML = `
            ${preview}
            <div class="modal-footer">
                <p><b>Valor:</b> R$ ${nota.valor} | <b>Data:</b> ${nota.data}</p>
                <button class="btn-deletar" onclick="window.deletarNota('${nota.id}')">
                    🗑️ EXCLUIR NOTA
                </button>
            </div>
        `;
    }
};
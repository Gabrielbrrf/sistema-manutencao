/* view.js - Focado apenas em Administração e seus subsetores */

export const View = {
    renderizarLista(lista) {
        const conteudo = document.getElementById('conteudo-lista');
        if (!conteudo) return;
        conteudo.innerHTML = "";

        // Como agora você quer centralizar tudo em Administração:
        const pessoasAdm = lista.filter(c => c.cidade === "Administração" || c.cidade === "Operacao");
        
        if (pessoasAdm.length === 0) {
            conteudo.innerHTML = "<p style='text-align:center; color:#64748b;'>Nenhum colaborador encontrado.</p>";
            return;
        }

        // --- BOTÃO PRINCIPAL: ADMINISTRAÇÃO ---
        const btnPrincipal = document.createElement('button');
        btnPrincipal.className = "btn-cidade-collapse administracao active"; // Já inicia ativo/aberto
        btnPrincipal.innerHTML = `👔 ADMINISTRAÇÃO GERAL <span class="seta">▼</span>`;
        
        const divSubSetores = document.createElement('div');
        divSubSetores.className = "painel-setores"; // Removi o 'hidden' para já iniciar visível

        btnPrincipal.onclick = () => {
            divSubSetores.classList.toggle('hidden');
            btnPrincipal.classList.toggle('active');
        };

        // --- SUBSETORES (Conforme seu HTML) ---
        const subSetoresConfig = [
            { id: 'Operacional', nome: '👷 OPERACIONAL' },
            { id: 'ADM', nome: '👔 ADM / OUTROS' }
        ];

        subSetoresConfig.forEach(setor => {
            // Filtra quem pertence a esse subsetor (categoria no banco)
            const filtrados = lista.filter(p => p.categoria === setor.id || (setor.id === 'Operacional' && p.categoria === 'Retifica'));

            if (filtrados.length > 0) {
                const btnSetor = document.createElement('button');
                btnSetor.className = "btn-setor-collapse";
                btnSetor.innerText = setor.nome;

                const divCards = document.createElement('div');
                divCards.className = "painel-cards hidden";
                btnSetor.onclick = () => divCards.classList.toggle('hidden');

                filtrados.forEach(c => {
                    divCards.appendChild(this.criarCard(c));
                });

                divSubSetores.appendChild(btnSetor);
                divSubSetores.appendChild(divCards);
            }
        });

        conteudo.appendChild(btnPrincipal);
        conteudo.appendChild(divSubSetores);
    },

    criarCard(c) {
        const card = document.createElement('div');
        // Se for Retifica ou Operacional, ganha destaque visual
        const destaque = (c.categoria === 'Retifica' || c.categoria === 'Operacional') ? 'card-destaque' : '';
        card.className = `contato-card ${destaque}`;
        
        // Mapeia o nome amigável da categoria
        const labels = {
            'Retifica': '🏢 Retífica (Jose)',
            'Operacional': '👷 Mecanico',
            'ADM': '👔 Administrativo'
        };

        card.innerHTML = `
            <div class="contato-info-box">
                <span class="nome-btn">${c.nome}</span>
                <small class="categoria-label">${labels[c.categoria] || c.categoria}</small>
            </div>
            <div class="pix-info-box">
                <b class="pix-display">${c.chave_pix}</b>
                <div class="pix-actions">
                    <button class="badge-edit" onclick="window.editarColab('${c.id}')">EDITAR</button>
                    <button class="badge-pix" onclick="window.copiarPix('${c.chave_pix}')">COPIAR</button>
                    <button class="badge-delete" onclick="window.excluirColab('${c.id}', '${c.nome}')">REMOVER</button>
                </div>
            </div>
        `;
        return card;
    },

    limparFormulario() {
        ['reg-nome', 'reg-pix', 'reg-tel', 'reg-banco'].forEach(id => {
            const el = document.getElementById(id);
            if(el) el.value = "";
        });
        const inputNome = document.getElementById('reg-nome');
        if(inputNome) inputNome.removeAttribute('data-id-editando');
        
        const btn = document.getElementById('btn-salvar');
        if(btn) {
            btn.innerText = "SALVAR NO BANCO";
            btn.style.background = "#27ae60";
        }
    }
};

window.copiarPix = (texto) => {
    navigator.clipboard.writeText(texto);
    alert('PIX Copiado!');
};
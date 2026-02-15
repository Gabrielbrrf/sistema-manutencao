/* view.js - Adaptada para Supabase com Funções Globais */

export const View = {
    renderizarLista(lista) {
        const conteudo = document.getElementById('conteudo-lista');
        if (!conteudo) return;
        conteudo.innerHTML = "";

        const cidades = ["Administração", "Santos", "São Vicente", "Guarujá", "Praia Grande"];
        
        cidades.forEach(cidade => {
            const pessoasCidade = lista.filter(c => c.cidade === cidade);
            if (pessoasCidade.length === 0) return; 

            // Criar botão da Cidade
            const btnCidade = document.createElement('button');
            const classeCss = cidade.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, "").replace(/\s/g, '');
            
            btnCidade.className = `btn-cidade-collapse ${classeCss}`;
            btnCidade.innerHTML = `${cidade === 'Administração' ? '👔' : '📍'} ${cidade.toUpperCase()} <span class="seta">▼</span>`;
            
            const divSetores = document.createElement('div');
            divSetores.className = "painel-setores hidden";

            btnCidade.onclick = () => {
                divSetores.classList.toggle('hidden');
                btnCidade.classList.toggle('active');
            };

            // Configuração de Setores
            const setoresConfig = cidade === "Administração" 
                ? [ { id: 'Operacional', nome: '👷 OPERACIONAL' }, { id: 'ADM', nome: '👔 ADM / OUTROS' } ]
                : [
                    { id: 'Clube XV', nome: '🏢 CLUBE XV' },
                    { id: 'Manutenção', nome: '🛠️ MANUTENÇÃO' },
                    { id: 'Daniel (PJ/MEI)', nome: '👷 DANIEL (PJ/MEI)' },
                    { id: 'Faxina', nome: '🧹 FAXINA / AVULSA' },
                    { id: 'Freelancer', nome: '🎸 FREELANCER' },
                    { id: 'CLT', nome: '📝 CLT' }
                ];

            setoresConfig.forEach(setor => {
                const filtrados = pessoasCidade.filter(p => p.categoria === setor.id);

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

                    divSetores.appendChild(btnSetor);
                    divSetores.appendChild(divCards);
                }
            });

            conteudo.appendChild(btnCidade);
            conteudo.appendChild(divSetores);
        });
    },

    criarCard(c) {
        const card = document.createElement('div');
        card.className = `contato-card ${c.categoria === 'Manutenção' || c.categoria === 'Operacional' ? 'card-destaque' : ''}`;
        
        card.innerHTML = `
            <div class="contato-info-box">
                <span class="nome-btn">${c.nome}</span>
                <small class="categoria-label">${c.categoria}</small>
            </div>
            <div class="pix-info-box">
                <b class="pix-display">${c.chave_pix}</b>
                <div class="pix-actions">
                    <button class="badge-edit" onclick="window.editarColab('${c.id}')">EDITAR</button>
                    <button class="badge-pix" onclick="copiarPix('${c.chave_pix}')">COPIAR</button>
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
        const btn = document.getElementById('btn-salvar');
        if(btn) {
            btn.innerText = "SALVAR NO BANCO";
            btn.style.background = "#27ae60";
        }
    }
};

// Função auxiliar para copiar
window.copiarPix = (texto) => {
    navigator.clipboard.writeText(texto);
    alert('PIX Copiado!');
};
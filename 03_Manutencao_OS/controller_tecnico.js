
/* controller_tecnico.js - EXCLUSIVO PARA O TIME DE CAMPO */
const TecnicoController = {
    async init() {
        // 1. Busca as OS que a Gabs abriu (Status: Pendente)
        const { data: ordens, error } = await window._supabase
            .from('ordens_servico')
            .select('*')
            .eq('status', 'Pendente')
            .order('id', { ascending: false });

        // 2. Renderiza apenas os cards para o técnico agir
        this.renderizarCardsTecnico(ordens || []);
    },

    renderizarCardsTecnico(ordens) {
        const container = document.getElementById('conteudoLista'); // Onde os cards aparecem
        container.innerHTML = ordens.length ? "" : "<p>Nenhum serviço pendente.</p>";

        ordens.forEach(os => {
            container.insertAdjacentHTML('beforeend', `
                <div class="card" style="border-left: 5px solid #10b981; padding:15px; background:white; margin-bottom:10px; border-radius:10px;">
                    <strong>📍 ${os.cliente}</strong><br>
                    <p>${os.descricao_servico}</p>
                    <button onclick="TecnicoController.abrirFinalizacao(${os.id})" id="btn-ini-${os.id}" style="background:#10b981; color:white; border:none; padding:10px; width:100%; border-radius:8px; font-weight:bold;">▶️ INICIAR / FINALIZAR</button>
                    
                    <div id="box-finalizar-${os.id}" style="display:none; margin-top:15px; border-top:1px dashed #ccc; padding-top:10px;">
                        <input type="number" id="mao-obra-${os.id}" placeholder="Mão de Obra R$" style="width:100%; padding:10px; margin-bottom:5px;">
                        <input type="number" id="material-${os.id}" placeholder="Materiais R$" style="width:100%; padding:10px; margin-bottom:5px;">
                        <input type="file" id="foto-${os.id}" accept="image/*" capture="camera" style="margin-bottom:10px;">
                        <button onclick="TecnicoController.salvarFinalizacao(${os.id})" style="background:#2563eb; color:white; border:none; padding:10px; width:100%; border-radius:8px;">✅ CONCLUIR</button>
                    </div>
                </div>
            `);
        });
    },

    abrirFinalizacao(id) {
        document.getElementById(`box-finalizar-${id}`).style.display = 'block';
        document.getElementById(`btn-ini-${id}`).style.display = 'none';
    },

    async salvarFinalizacao(id) {
        const maoObra = document.getElementById(`mao-obra-${id}`).value;
        const material = document.getElementById(`material-${id}`).value;
        const fotoInput = document.getElementById(`foto-${id}`);

        if (!maoObra) { alert("Preencha a mão de obra!"); return; }

        let base64 = "";
        if (fotoInput.files.length > 0) {
            const reader = new FileReader();
            base64 = await new Promise(res => {
                reader.readAsDataURL(fotoInput.files[0]);
                reader.onload = () => res(reader.result);
            });
        }

        // AQUI ESTÁ A MUDANÇA: Usamos UPDATE em vez de INSERT
        const { error } = await window._supabase
            .from('ordens_servico')
            .update({
                status: 'Concluido',
                valor_mao_de_obra: parseFloat(maoObra),
                valor_gasto: parseFloat(material || 0),
                foto_nf: base64,
                hora_conclusao: new Date().toISOString()
            })
            .eq('id', id);

        if (!error) {
            alert("Serviço concluído!");
            location.reload();
        }
    }
};

window.addEventListener('load', () => TecnicoController.init());

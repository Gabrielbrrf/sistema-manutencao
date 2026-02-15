/* model_os.js */
const SUPABASE_URL = 'https://olawjagrfhcxsonmyopi.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9sYXdqYWdyZmhjeHNvbm15b3BpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA5Mzc2NTEsImV4cCI6MjA4NjUxMzY1MX0.KB-n1QyDmDarzBofPuZ-SGUSUCwJsFq9p-HV3bWWMaY'; 

// MOTOR DO SISTEMA - INICIALIZAÇÃO DO CLIENTE
if (!window._supabase) {
    window._supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
}

const ManutencaoModel = {
    // BUSCA TÉCNICOS: Prioriza o banco, mas tem o time oficial de backup
    async buscarTecnicos() {
        try {
            const { data, error } = await window._supabase
                .from('contatos')
                .select('nome')
                .order('nome');
            
            if (error || !data || data.length === 0) throw error;
            return data.map(t => t.nome);
        } catch (err) {
            console.error("Erro ao buscar técnicos no banco, carregando lista oficial:", err);
            // Nomes atualizados conforme sua equipe
            return ["Israel Sillas", "Wil Sampaio"]; 
        }
    },

    // SALVAR OS: Insere os dados da manutenção
    async salvarNoBanco(dados) {
        return await window._supabase
            .from('ordens_servico')
            .insert([dados])
            .select();
    },

    // BUSCAR TODAS AS OS: Para o monitoramento do ADM
    async buscarTodasOS() {
        return await window._supabase
            .from('ordens_servico')
            .select('*')
            .order('hora_conclusao', { ascending: false });
    },

    // UPLOAD DE NF: Caso decida usar o Storage do Supabase em vez de Base64 no futuro
    async uploadNF(arquivo) {
        try {
            const nomeArquivo = `${Date.now()}_${arquivo.name}`;
            const { error } = await window._supabase.storage
                .from('notas_fiscais')
                .upload(nomeArquivo, arquivo);
            
            if (error) throw error;

            const { data } = window._supabase.storage
                .from('notas_fiscais')
                .getPublicUrl(nomeArquivo);
                
            return data.publicUrl;
        } catch (err) {
            console.error("Erro no upload da NF:", err);
            return "";
        }
    }
};

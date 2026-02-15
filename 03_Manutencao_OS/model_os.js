/* model_os.js - ATUALIZADO: APENAS ISRAEL E WIL */
const SUPABASE_URL = 'https://olawjagrfhcxsonmyopi.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9sYXdqYWdyZmhjeHNvbm15b3BpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA5Mzc2NTEsImV4cCI6MjA4NjUxMzY1MX0.KB-n1QyDmDarzBofPuZ-SGUSUCwJsFq9p-HV3bWWMaY'; 

// MOTOR DO SISTEMA
if (!window._supabase) {
    window._supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
}

const ManutencaoModel = {
    // Agora retorna DIRETO os dois, sem buscar a lista de contatos do banco
    async buscarTecnicos() {
        console.log("Carregando técnicos oficiais...");
        return ["Israel Sillas", "Wil Sampaio"]; 
    },

    async salvarNoBanco(dados) {
        return await window._supabase
            .from('ordens_servico')
            .insert([dados])
            .select();
    },

    async buscarTodasOS() {
        return await window._supabase
            .from('ordens_servico')
            .select('*')
            .order('hora_conclusao', { ascending: false });
    },

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

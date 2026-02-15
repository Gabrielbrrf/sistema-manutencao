/* auth_check.js */
(function() {
    const usuario = JSON.parse(localStorage.getItem('usuarioLogado'));
    
    // Se não estiver logado, volta pro login
    if (!usuario) {
        window.location.href = "../index.html"; // Ajuste o caminho se necessário
        return;
    }

    const nivel = usuario.empresa;
    const path = window.location.pathname;

    // Páginas que SÓ o MASTER/ADM pode ver
    const paginasMaster = ['financeiro.html', 'gestao_pix.html', 'relatorio.html'];

    if (paginasMaster.some(p => path.includes(p)) && nivel !== 'MASTER' && nivel !== 'ADM') {
        alert("Acesso Negado! Área restrita ao administrador.");
        window.location.href = "../portal.html";
    }
})();
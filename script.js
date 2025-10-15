// ================== CONFIG ==================
const APPS_SCRIPT_BASE = 'https://script.google.com/macros/s/AKfycbzJYBg29MHEUXmlFl9ra1tXABuRwKpavid1AydCQ2A6M0s--XCwiZepaKLcU-JMVT2atg/exec';
const SUBMIT_URL = `${APPS_SCRIPT_BASE}?action=submit`;
// ===========================================

const tituloEl = document.getElementById('desafio_titulo');
const descEl   = document.getElementById('desafio_desc');
const btn      = document.getElementById('btn-enviar');
const fb       = document.getElementById('feedback');

btn.addEventListener('click', async () => {
  const titulo = (tituloEl.value || '').trim();
  const desc   = (descEl.value || '').trim();

  if (!titulo) { fb.textContent = 'Informe um título.'; return; }
  if (desc.length > 300) { fb.textContent = 'Descrição deve ter até 300 caracteres.'; return; }

  fb.textContent = 'Enviando...';
  btn.disabled = true;

  try{
    const res = await fetch(SUBMIT_URL, {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ tipo:'proposta', titulo, desc })
    });
    const data = await res.json();
    if (data?.ok){
      fb.textContent = 'Proposta enviada! Obrigado.';
      tituloEl.value = '';
      descEl.value = '';
    } else {
      fb.textContent = 'Falha ao enviar. Tente novamente.';
    }
  }catch(e){
    fb.textContent = 'Erro de rede.';
  }finally{
    btn.disabled = false;
  }
});

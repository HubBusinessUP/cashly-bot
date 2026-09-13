'use strict'
const $ = id => document.getElementById(id)
const tabsEl = $('tabs')
const newTabBtn = $('newtab')
const state = new Map()
let activeId = null

function renderTab (s) {
  let el = document.querySelector(`.tab[data-id="${s.id}"]`)
  if (!el) {
    el = document.createElement('div')
    el.className = 'tab'
    el.dataset.id = s.id
    el.innerHTML = '<span></span><i title="Chiudi">×</i>'
    el.addEventListener('click', e => {
      if (e.target.tagName === 'I') window.anon.tab('close', s.id)
      else window.anon.tab('activate', s.id)
    })
    tabsEl.insertBefore(el, newTabBtn)
  }
  el.querySelector('span').textContent = s.loading ? 'Caricamento…' : (s.title || 'Nuova scheda')
  el.title = s.url || ''
  el.classList.toggle('active', s.id === activeId)
}

function paint () {
  const s = state.get(activeId)
  $('back').disabled = !s || !s.canBack
  $('fwd').disabled = !s || !s.canForward
  $('reload').textContent = s && s.loading ? '×' : '⟳'
  if (s && document.activeElement !== $('url')) $('url').value = s.url === 'about:blank' ? '' : (s.url || '')
  for (const v of state.values()) renderTab(v)
}

window.anon.on('tab:state', s => {
  if (s.active) activeId = s.id
  state.set(s.id, s)
  paint()
})
window.anon.on('tab:closed', ({ id }) => {
  state.delete(id)
  const el = document.querySelector(`.tab[data-id="${id}"]`)
  if (el) el.remove()
  paint()
})
window.anon.on('tor:status', ({ state: st, detail }) => {
  $('dot').className = 'dot ' + st
  const label = { bootstrap: 'Tor ' + detail, ready: 'Tor attivo', down: 'Tor giù — bloccato', error: 'Errore: ' + detail }
  $('tor').textContent = label[st] || st
  $('tor').title = detail || ''
})

$('back').onclick = () => window.anon.nav('back')
$('fwd').onclick = () => window.anon.nav('forward')
$('reload').onclick = () => {
  const s = state.get(activeId)
  window.anon.nav(s && s.loading ? 'stop' : 'reload')
}
$('url').addEventListener('keydown', e => {
  if (e.key === 'Enter') { window.anon.nav('go', $('url').value); $('url').blur() }
  if (e.key === 'Escape') { $('url').blur(); paint() }
})
newTabBtn.onclick = () => window.anon.tab('new')
$('ident').onclick = async e => {
  e.target.disabled = true
  e.target.textContent = 'Cambio…'
  try { await window.anon.newIdentity() } finally {
    e.target.disabled = false
    e.target.textContent = 'Nuova identità'
  }
}
$('js').onclick = async e => {
  const on = await window.anon.toggleJs()
  e.target.classList.toggle('on', on)
  e.target.style.color = on ? '' : 'var(--err)'
}
$('panic').onclick = () => window.anon.panic()

document.addEventListener('keydown', e => {
  const mod = e.ctrlKey || e.metaKey
  if (!mod) return
  if (e.key === 't') window.anon.tab('new')
  if (e.key === 'w') window.anon.tab('close', activeId)
  if (e.key === 'r') window.anon.nav('reload')
  if (e.key === 'l') { $('url').focus(); $('url').select() }
  if (e.shiftKey && e.key.toLowerCase() === 'u') window.anon.newIdentity()
})

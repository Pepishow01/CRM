(function () {
  var token = window.CRMWidgetToken;
  if (!token) return;

  var API = (window.CRMApiUrl || 'http://localhost:3001') + '/api/v1';
  var chatId = null;
  var color = '#6366f1';
  var open = false;
  var pollInterval = null;
  var lastCount = 0;

  // Fetch config
  fetch(API + '/widget/config/' + token)
    .then(function (r) { return r.json(); })
    .then(function (cfg) {
      color = cfg.color || color;
      buildWidget(cfg.welcomeMessage || '¡Hola! ¿En qué te puedo ayudar?');
    })
    .catch(function () { buildWidget('¡Hola! ¿En qué te puedo ayudar?'); });

  function buildWidget(welcome) {
    var style = document.createElement('style');
    style.textContent = [
      '#crm-widget-btn{position:fixed;bottom:24px;right:24px;width:56px;height:56px;border-radius:50%;border:none;cursor:pointer;box-shadow:0 4px 16px rgba(0,0,0,0.18);z-index:99999;font-size:24px;color:#fff;display:flex;align-items:center;justify-content:center;transition:transform 0.2s;}',
      '#crm-widget-btn:hover{transform:scale(1.08);}',
      '#crm-widget-box{position:fixed;bottom:90px;right:24px;width:340px;height:480px;border-radius:16px;box-shadow:0 8px 32px rgba(0,0,0,0.18);background:#fff;z-index:99998;display:none;flex-direction:column;overflow:hidden;font-family:sans-serif;}',
      '#crm-widget-header{padding:16px;color:#fff;font-weight:600;font-size:15px;}',
      '#crm-widget-msgs{flex:1;overflow-y:auto;padding:12px;background:#f9fafb;display:flex;flex-direction:column;gap:8px;}',
      '.crm-msg{max-width:80%;padding:8px 12px;border-radius:12px;font-size:13px;line-height:1.4;}',
      '.crm-msg-in{align-self:flex-start;background:#fff;border:1px solid #e5e7eb;color:#111;}',
      '.crm-msg-out{align-self:flex-end;color:#fff;}',
      '#crm-widget-form{display:flex;gap:8px;padding:10px;border-top:1px solid #e5e7eb;background:#fff;}',
      '#crm-widget-input{flex:1;padding:8px 10px;border-radius:8px;border:1px solid #e5e7eb;font-size:13px;outline:none;}',
      '#crm-widget-send{padding:8px 12px;border-radius:8px;border:none;color:#fff;font-weight:600;cursor:pointer;font-size:13px;}',
    ].join('');
    document.head.appendChild(style);

    var btn = document.createElement('button');
    btn.id = 'crm-widget-btn';
    btn.style.background = color;
    btn.innerHTML = '💬';
    btn.onclick = toggleWidget;
    document.body.appendChild(btn);

    var box = document.createElement('div');
    box.id = 'crm-widget-box';
    box.innerHTML = '<div id="crm-widget-header" style="background:' + color + '">Chat con nosotros</div>' +
      '<div id="crm-widget-msgs"><div class="crm-msg crm-msg-in">' + welcome + '</div></div>' +
      '<div id="crm-widget-form">' +
      '<input id="crm-widget-input" placeholder="Escribe un mensaje..." />' +
      '<button id="crm-widget-send" style="background:' + color + '">Enviar</button></div>';
    document.body.appendChild(box);

    document.getElementById('crm-widget-send').onclick = sendMessage;
    document.getElementById('crm-widget-input').addEventListener('keydown', function (e) {
      if (e.key === 'Enter') sendMessage();
    });

    if (!chatId) {
      var saved = sessionStorage.getItem('crm_widget_chat_' + token);
      if (saved) chatId = saved;
    }
  }

  function toggleWidget() {
    open = !open;
    var box = document.getElementById('crm-widget-box');
    box.style.display = open ? 'flex' : 'none';
    document.getElementById('crm-widget-btn').innerHTML = open ? '✕' : '💬';
    if (open && chatId) pollMessages();
  }

  function sendMessage() {
    var input = document.getElementById('crm-widget-input');
    var msg = input.value.trim();
    if (!msg) return;
    input.value = '';
    addMsg(msg, true);

    if (!chatId) {
      var name = prompt('¿Cuál es tu nombre?') || 'Visitante';
      fetch(API + '/widget/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ widgetToken: token, visitorName: name, message: msg }),
      })
        .then(function (r) { return r.json(); })
        .then(function (d) {
          chatId = d.chatId;
          sessionStorage.setItem('crm_widget_chat_' + token, chatId);
          if (open) pollMessages();
        });
    } else {
      fetch(API + '/widget/conversations/' + chatId + '/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-widget-token': token },
        body: JSON.stringify({ widgetToken: token, content: msg }),
      });
    }
  }

  function addMsg(text, outbound) {
    var msgs = document.getElementById('crm-widget-msgs');
    var div = document.createElement('div');
    div.className = 'crm-msg ' + (outbound ? 'crm-msg-out' : 'crm-msg-in');
    if (outbound) div.style.background = color;
    div.textContent = text;
    msgs.appendChild(div);
    msgs.scrollTop = msgs.scrollHeight;
  }

  function pollMessages() {
    if (pollInterval) clearInterval(pollInterval);
    pollInterval = setInterval(function () {
      if (!chatId || !open) return;
      fetch(API + '/widget/conversations/' + chatId + '/messages', {
        headers: { 'x-widget-token': token },
      })
        .then(function (r) { return r.json(); })
        .then(function (msgs) {
          var outbound = msgs.filter(function (m) { return m.direction === 'outbound'; });
          if (outbound.length > lastCount) {
            for (var i = lastCount; i < outbound.length; i++) {
              addMsg(outbound[i].content, false);
            }
            lastCount = outbound.length;
          }
        });
    }, 3000);
  }
})();

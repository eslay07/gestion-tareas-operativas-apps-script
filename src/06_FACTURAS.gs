/*****************************************************************
 * 06_FACTURAS.gs
 * Gestor de Facturas por Compartir
 * Gmail parsing + recordatorios escalados + WhatsApp
 *****************************************************************/

var FAC_CONFIG = {
  REMITENTES: [
    (typeof SYS_CFG !== 'undefined' ? SYS_CFG.DEFAULTS.EMAIL_DEMO : 'usuario.demo@empresa.com'),
    (typeof SYS_CFG !== 'undefined' ? SYS_CFG.DEFAULTS.FACTURAS_DEMO : 'facturas.demo@empresa.com')
  ],
  ASUNTO_BUSQUEDA: 'DETALLE DE ENTREGA DE FACTURAS',
  EMAIL_ALERTAS: (typeof SYS_CFG !== 'undefined' ? SYS_CFG.DEFAULTS.EMAIL_DEMO : 'usuario.demo@empresa.com'),
  NOMBRE_HOJA_FAC: (typeof SYS_CFG !== 'undefined' ? SYS_CFG.SHEETS.FAC : 'FAC POR COMPARTIR'),
  NOMBRE_HOJA_CONFIG: (typeof SYS_CFG !== 'undefined' ? SYS_CFG.SHEETS.CONFIG : 'Configuración'),
  DIAS_LIMITE: 3,
  HORA_RECORDATORIO: 8,
  ZONA_HORARIA: (typeof SYS_getTz_ === 'function' ? SYS_getTz_() : 'America/Guayaquil'),
  LABEL_PROCESADO: 'FAC_PROCESADO'
};

function instalarMenuFacturas() {
  crearMenuSistema();
  SpreadsheetApp.getUi().alert('✅ Facturas integrado al menú unificado.');
}

function crearMenuFacturas() {
  return crearMenuSistema();
}

function facInicializarHoja() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var h = ss.getSheetByName(FAC_CONFIG.NOMBRE_HOJA_FAC) || ss.insertSheet(FAC_CONFIG.NOMBRE_HOJA_FAC);
  var headers = ['NUMERO','PROVEEDOR','NUMERO DE FACTURA','FECHA DE FAC','ORDEN DE COMPRA','NUMERO DE INGRESO','NUMERO DE TAREA','','FACTURA COMNARTIDA(X=SI)','FECHA REGISTRO','DÍAS SIN COMPARTIR','ESTADO'];
  h.getRange(1,1,1,headers.length).setValues([headers]);
  h.getRange(1,1,1,headers.length).setBackground('#0d47a1').setFontColor('#fff').setFontWeight('bold').setHorizontalAlignment('center').setWrap(true);
  h.setFrozenRows(1);
  [50,180,100,120,100,130,120,60,110,130,140,120].forEach(function(w,i){h.setColumnWidth(i+1,w);});
  try { if (!GmailApp.getUserLabelByName(FAC_CONFIG.LABEL_PROCESADO)) GmailApp.createLabel(FAC_CONFIG.LABEL_PROCESADO); } catch(e){}
  SpreadsheetApp.getUi().alert('✅ Hoja "FAC POR COMPARTIR" lista.');
}

function _facBuildDupSet_(h) {
  var lr = h.getLastRow();
  var map = {};
  if (lr < 2) return map;
  var vals = h.getRange(2, 3, lr - 1, 4).getValues(); // C:F
  for (var i = 0; i < vals.length; i++) {
    var key = String(vals[i][0]).trim() + '|' + String(vals[i][3]).trim();
    map[key] = true;
  }
  return map;
}

function facRevisarCorreos() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var h = ss.getSheetByName(FAC_CONFIG.NOMBRE_HOJA_FAC);
  if (!h) {
    facInicializarHoja();
    h = ss.getSheetByName(FAC_CONFIG.NOMBRE_HOJA_FAC);
  }

  var nuevos = [];
  var dupSet = _facBuildDupSet_(h);

  FAC_CONFIG.REMITENTES.forEach(function(rem) {
    var query = 'from:' + rem + ' subject:"' + FAC_CONFIG.ASUNTO_BUSQUEDA + '"';
    var threads = [];
    try { threads = GmailApp.search(query, 0, 20); } catch (e) { return; }
    if (!threads.length) return;

    threads.forEach(function(thread) {
      thread.getMessages().forEach(function(msg) {
        var filas = _facExtraerFilasJ(msg.getBody());
        filas.forEach(function(fila) {
          var key = String(fila.nCredito).trim() + '|' + String(fila.nIngreso).trim();
          if (dupSet[key]) return;
          dupSet[key] = true;
          nuevos.push([
            fila.numero, fila.proveedor, fila.nCredito, fila.fechaFactura, fila.ordenCompra,
            fila.nIngreso, fila.nTarea, 'J', '', new Date(), '', 'PENDIENTE'
          ]);
        });
      });
    });
  });

  if (nuevos.length) {
    h.getRange(h.getLastRow() + 1, 1, nuevos.length, 12).setValues(nuevos);
  }

  _facActualizarEstados(h);
  _facAplicarFormato(h);
  return nuevos.length;
}

function facRevisarCorreosManual() {
  var n = facRevisarCorreos();
  SpreadsheetApp.getUi().alert('📥 Revisión completada\nFacturas nuevas con "J": ' + (n || 0));
}

function _facExtraerFilasJ(htmlBody) {
  var filasJ = [];
  try {
    var tables = htmlBody.match(/<table[^>]*>([\s\S]*?)<\/table>/gi);
    if (!tables) return filasJ;
    tables.forEach(function(table) {
      var rowRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi, rowMatch;
      while ((rowMatch = rowRegex.exec(table)) !== null) {
        var cellRegex = /<td[^>]*>([\s\S]*?)<\/td>/gi, cells = [], cellMatch;
        while ((cellMatch = cellRegex.exec(rowMatch[1])) !== null) {
          cells.push(cellMatch[1].replace(/<[^>]*>/g,'').replace(/&nbsp;/g,' ').replace(/\s+/g,' ').trim());
        }
        if (cells.length >= 7 && cells[cells.length-1].toUpperCase().trim() === 'J') {
          var n = cells.length >= 8;
          filasJ.push({
            numero: cells[0],
            proveedor: n ? cells[1] : cells[0],
            nCredito: n ? cells[2] : cells[1],
            fechaFactura: n ? cells[3] : cells[2],
            ordenCompra: n ? cells[4] : cells[3],
            nIngreso: n ? cells[5] : cells[4],
            nTarea: n ? cells[6] : cells[5]
          });
        }
      }
    });
  } catch (e) {}
  return filasJ;
}

function _facExisteDup(h, nCred, nIng) {
  var lr = h.getLastRow(); if (lr < 2) return false;
  var d = h.getRange(2,3,lr-1,4).getValues();
  for (var i=0;i<d.length;i++) {
    if (String(d[i][0]).trim()===String(nCred).trim() && String(d[i][3]).trim()===String(nIng).trim()) return true;
  }
  return false;
}

function _facActualizarEstados(h) {
  var lr = h.getLastRow();
  if (lr < 2) return;
  var ahora = new Date();
  var d = h.getRange(2,1,lr-1,12).getValues();
  var outKL = [];
  var backgrounds = [];

  d.forEach(function(f) {
    var comp = String(f[8]).toUpperCase().trim();
    var fechaRegistro = f[9];
    var diasTxt = '';
    var estadoTxt = 'PENDIENTE';
    var bg = '#ffffff';

    if (comp === 'X') {
      diasTxt = '—';
      estadoTxt = '✅ COMPARTIDA';
      bg = '#e8f5e9';
    } else if (fechaRegistro) {
      var dias = Math.floor((ahora - new Date(fechaRegistro)) / 86400000);
      diasTxt = dias + ' día(s)';
      if (dias >= FAC_CONFIG.DIAS_LIMITE) { estadoTxt = '🔴 CRÍTICO'; bg = '#ffcdd2'; }
      else if (dias >= 2) { estadoTxt = '🟠 URGENTE'; bg = '#fff3e0'; }
      else if (dias >= 1) { estadoTxt = '🟡 PENDIENTE'; bg = '#fffde7'; }
      else { estadoTxt = '🔵 NUEVO'; bg = '#e3f2fd'; }
    }

    outKL.push([diasTxt, estadoTxt]);
    var row = [];
    for (var i = 0; i < 12; i++) row.push(bg);
    backgrounds.push(row);
  });

  h.getRange(2, 11, outKL.length, 2).setValues(outKL);
  h.getRange(2, 1, backgrounds.length, 12).setBackgrounds(backgrounds);
}

function _facAplicarFormato(h) {
  if (h.getLastRow() < 1) return;
  h.getRange(1,1,1,12).setBackground('#0d47a1').setFontColor('#fff').setFontWeight('bold').setHorizontalAlignment('center');
}

function facVerPendientes() {
  var h = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(FAC_CONFIG.NOMBRE_HOJA_FAC);
  if (!h || h.getLastRow()<2) { SpreadsheetApp.getUi().alert('No hay facturas.'); return; }
  _facActualizarEstados(h);
  var d = h.getRange(2,1,h.getLastRow()-1,12).getValues();
  var pend = d.filter(function(f){return String(f[8]).toUpperCase().trim()!=='X';});
  if (!pend.length) { SpreadsheetApp.getUi().alert('🎉 Todas compartidas.'); return; }
  var crit = pend.filter(function(f){return String(f[11]).indexOf('CRÍTICO') !== -1;});
  pend.sort(function(a,b){return (parseInt(b[10],10)||0)-(parseInt(a[10],10)||0);});
  var rows = pend.map(function(f){
    var cls = String(f[11]).indexOf('CRÍTICO') !== -1 ? 'background:#ffcdd2' : String(f[11]).indexOf('URGENTE') !== -1 ? 'background:#fff3e0' : '';
    return '<tr style="'+cls+'"><td><strong>'+f[1]+'</strong></td><td>'+f[2]+'</td><td>'+f[3]+'</td><td>'+f[5]+'</td><td>'+f[6]+'</td><td style="text-align:center;font-weight:700">'+f[10]+'</td><td>'+f[11]+'</td></tr>';
  }).join('');
  var html = '<html><head><style>body{font-family:"Segoe UI",sans-serif;padding:16px;background:#f8f9fa}h2{color:#0d47a1;font-size:16px}table{width:100%;border-collapse:collapse;font-size:12px;margin-top:10px}th{background:#0d47a1;color:#fff;padding:6px 8px;text-align:left}td{padding:6px 8px;border-bottom:1px solid #e0e0e0}.s{display:flex;gap:8px;margin:10px 0}.st{flex:1;text-align:center;padding:10px;border-radius:8px}.sn{font-size:24px;font-weight:700}.sl{font-size:11px;color:#666}</style></head><body><h2>📄 Pendientes ('+pend.length+')</h2><div class="s"><div class="st" style="background:#ffcdd2"><div class="sn">'+crit.length+'</div><div class="sl">🔴 Críticas</div></div><div class="st" style="background:#e3f2fd"><div class="sn">'+pend.length+'</div><div class="sl">📄 Total</div></div></div><table><tr><th>Proveedor</th><th>Crédito</th><th>Fecha</th><th>Ingreso</th><th>Tarea</th><th>Días</th><th>Estado</th></tr>'+rows+'</table></body></html>';
  SpreadsheetApp.getUi().showModalDialog(HtmlService.createHtmlOutput(html).setWidth(720).setHeight(500),'📄 Pendientes');
}

function facVerCriticas() {
  var h = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(FAC_CONFIG.NOMBRE_HOJA_FAC);
  if (!h || h.getLastRow()<2) { SpreadsheetApp.getUi().alert('No hay facturas.'); return; }
  _facActualizarEstados(h);
  var d = h.getRange(2,1,h.getLastRow()-1,12).getValues();
  var crit = d.filter(function(f){return String(f[8]).toUpperCase().trim()!=='X' && String(f[11]).indexOf('CRÍTICO') !== -1;});
  if (!crit.length) { SpreadsheetApp.getUi().alert('✅ No hay críticas.'); return; }
  var msg = '🔴 CRÍTICAS (3+ días):\n\n';
  crit.forEach(function(f){msg += '• '+f[1]+' | Cred:'+f[2]+' | Ing:'+f[5]+' | '+f[10]+'\n';});
  SpreadsheetApp.getUi().alert(msg);
}

function facRecordatorioDiario() {
  facRevisarCorreos();
  var h = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(FAC_CONFIG.NOMBRE_HOJA_FAC);
  if (!h || h.getLastRow()<2) return;
  _facActualizarEstados(h);
  var d = h.getRange(2,1,h.getLastRow()-1,12).getValues();
  var pend = d.filter(function(f){return String(f[8]).toUpperCase().trim()!=='X';});
  if (!pend.length) return;
  var crit = pend.filter(function(f){return String(f[11]).indexOf('CRÍTICO') !== -1;});
  var urg = pend.filter(function(f){return String(f[11]).indexOf('URGENTE') !== -1;});
  _facEnviarEmailRec(pend, crit, urg, SpreadsheetApp.getActiveSpreadsheet().getUrl());
  _facEnviarWARec(pend, crit, urg);
}

function facAlertaCritica() {
  var h = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(FAC_CONFIG.NOMBRE_HOJA_FAC);
  if (!h || h.getLastRow()<2) return;
  _facActualizarEstados(h);
  var d = h.getRange(2,1,h.getLastRow()-1,12).getValues();
  var crit = d.filter(function(f){return String(f[8]).toUpperCase().trim()!=='X' && String(f[11]).indexOf('CRÍTICO') !== -1;});
  if (!crit.length) return;
  var ahora = Utilities.formatDate(new Date(), FAC_CONFIG.ZONA_HORARIA, 'dd/MM/yyyy HH:mm');
  var rows = crit.map(function(f){return '<tr style="background:#ffebee"><td style="padding:6px 8px"><strong>'+f[1]+'</strong></td><td style="padding:6px 8px">'+f[2]+'</td><td style="padding:6px 8px">'+f[5]+'</td><td style="padding:6px 8px">'+f[6]+'</td><td style="padding:6px 8px;text-align:center;font-weight:700;color:#d32f2f">'+f[10]+'</td></tr>';}).join('');
  var html = '<div style="font-family:\'Segoe UI\',sans-serif;max-width:600px;margin:0 auto"><div style="background:#d32f2f;color:#fff;padding:20px;border-radius:10px 10px 0 0;text-align:center"><h1 style="margin:0;font-size:20px">🚨 ALERTA CRÍTICA — FACTURAS</h1><p style="margin:6px 0 0;opacity:.9">'+ahora+'</p></div><div style="background:#fff;padding:20px;border:2px solid #d32f2f;border-top:none;border-radius:0 0 10px 10px"><p style="font-size:14px;color:#d32f2f;font-weight:700">'+crit.length+' factura(s) con 3+ días sin compartir.</p><table style="width:100%;border-collapse:collapse;font-size:13px;margin:12px 0"><tr style="background:#d32f2f;color:#fff"><th style="padding:6px 8px">Proveedor</th><th style="padding:6px 8px">Crédito</th><th style="padding:6px 8px">Ingreso</th><th style="padding:6px 8px">Tarea</th><th style="padding:6px 8px">Días</th></tr>'+rows+'</table><div style="text-align:center;margin-top:16px"><a href="'+SpreadsheetApp.getActiveSpreadsheet().getUrl()+'" style="background:#d32f2f;color:#fff;padding:10px 24px;border-radius:8px;text-decoration:none;font-weight:600">📄 Abrir Facturas</a></div></div></div>';
  try { MailApp.sendEmail({to:FAC_CONFIG.EMAIL_ALERTAS, subject:'🚨 CRÍTICO: '+crit.length+' factura(s) 3+ días — '+ahora, htmlBody:html}); } catch(e){}
  _facEnviarWACrit(crit);
}

function _facEnviarEmailRec(pend, crit, urg, url) {
  var ahora = Utilities.formatDate(new Date(), FAC_CONFIG.ZONA_HORARIA, 'dd/MM/yyyy');
  var html = '<div style="font-family:\'Segoe UI\',sans-serif;max-width:650px;margin:0 auto;background:#f8f9fa"><div style="background:#0d47a1;color:#fff;padding:20px;border-radius:10px 10px 0 0;text-align:center"><h1 style="margin:0;font-size:18px">📄 Facturas Pendientes</h1><p style="margin:6px 0 0;opacity:.85">'+ahora+'</p></div><div style="background:#fff;padding:16px;border-radius:0 0 10px 10px">';
  html += '<div style="display:flex;text-align:center;margin-bottom:12px;gap:6px"><div style="flex:1;padding:10px;background:'+(crit.length>0?'#ffebee':'#e8f5e9')+';border-radius:8px"><div style="font-size:24px;font-weight:700;color:'+(crit.length>0?'#d32f2f':'#2e7d32')+'">'+crit.length+'</div><div style="font-size:11px">Críticas</div></div><div style="flex:1;padding:10px;background:#fff3e0;border-radius:8px"><div style="font-size:24px;font-weight:700;color:#e65100">'+urg.length+'</div><div style="font-size:11px">Urgentes</div></div><div style="flex:1;padding:10px;background:#e3f2fd;border-radius:8px"><div style="font-size:24px;font-weight:700;color:#0d47a1">'+pend.length+'</div><div style="font-size:11px">Total</div></div></div>';
  if (crit.length>0) { html += '<div style="background:#ffebee;border-left:4px solid #d32f2f;padding:10px;border-radius:0 6px 6px 0;margin-bottom:10px"><strong style="color:#d32f2f">🚨 Críticas</strong>'; crit.forEach(function(f){html += '<div style="padding:3px 0;font-size:12px;border-bottom:1px solid #ffcdd2">🔴 <strong>'+f[1]+'</strong> — '+f[2]+' — '+f[10]+'</div>';}); html += '</div>'; }
  var otras = pend.filter(function(f){return String(f[11]).indexOf('CRÍTICO') === -1;});
  if (otras.length>0) { html += '<div style="background:#f5f5f5;border-left:4px solid #1565c0;padding:10px;border-radius:0 6px 6px 0"><strong style="color:#1565c0">📋 Otras ('+otras.length+')</strong>'; otras.forEach(function(f){html += '<div style="padding:3px 0;font-size:12px;border-bottom:1px solid #e0e0e0">'+(String(f[11]).indexOf('URGENTE')!==-1?'🟠':'🔵')+' '+f[1]+' — '+f[2]+' — '+f[10]+'</div>';}); html += '</div>'; }
  html += '<div style="text-align:center;padding:12px 0 0;border-top:1px solid #eee;margin-top:10px"><a href="'+url+'" style="background:#0d47a1;color:#fff;padding:8px 24px;border-radius:6px;text-decoration:none;font-weight:600">📄 Abrir Facturas</a></div></div></div>';
  var asunto = '📄 '+pend.length+' por compartir — '+ahora;
  if (crit.length>0) asunto = '🚨 '+crit.length+' CRÍT. — '+asunto;
  try { MailApp.sendEmail({to:FAC_CONFIG.EMAIL_ALERTAS, subject:asunto, htmlBody:html}); } catch(e){}
}

function _facEnviarWARec(pend, crit, urg) {
  var hc = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(FAC_CONFIG.NOMBRE_HOJA_CONFIG); if (!hc) return;
  var id=String(hc.getRange('B6').getValue()||'').trim(), tk=String(hc.getRange('B7').getValue()||'').trim(), ch=String(hc.getRange('B8').getValue()||'').trim();
  if (!id||!tk||!ch) return;
  var msg = '📄 *FACTURAS POR COMPARTIR*\n'+Utilities.formatDate(new Date(),FAC_CONFIG.ZONA_HORARIA,'dd/MM/yyyy HH:mm')+'\n━━━━━━━━━━━━━━━━━\n📌 Pendientes: *'+pend.length+'*\n🔴 Críticas: *'+crit.length+'*\n🟠 Urgentes: *'+urg.length+'*\n';
  if (crit.length>0) { msg += '\n🚨 *CRÍTICAS:*\n'; crit.forEach(function(f){msg += '  🔴 '+f[1]+' | '+f[2]+' | '+f[10]+'\n';}); }
  msg += '\n📎 Comparte y pon la X.';
  _facEnviarWA(id,tk,ch,msg);
}

function _facEnviarWACrit(crit) {
  var hc = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(FAC_CONFIG.NOMBRE_HOJA_CONFIG); if (!hc) return;
  var id=String(hc.getRange('B6').getValue()||'').trim(), tk=String(hc.getRange('B7').getValue()||'').trim(), ch=String(hc.getRange('B8').getValue()||'').trim();
  if (!id||!tk||!ch) return;
  var msg = '🚨🚨🚨 *ALERTA CRÍTICA* 🚨🚨🚨\n\n*'+crit.length+' factura(s) 3+ DÍAS sin compartir*\n\n';
  crit.forEach(function(f){msg += '🔴 *'+f[1]+'*\n   Cred: '+f[2]+' | Ing: '+f[5]+' | ⏰ *'+f[10]+'*\n\n';});
  msg += '⚠️ Se repite cada 3h.\n📎 Comparte YA.';
  _facEnviarWA(id,tk,ch,msg);
}

function _facEnviarWA(id,tk,ch,msg) {
  try { UrlFetchApp.fetch('https://api.greenapi.com/waInstance'+id+'/sendMessage/'+tk, {method:'post',contentType:'application/json',payload:JSON.stringify({chatId:ch,message:msg}),muteHttpExceptions:true}); } catch(e){}
}

function facEnviarRecordatorioManual() { facRecordatorioDiario(); SpreadsheetApp.getUi().alert('✅ Recordatorio enviado.'); }

function facActivarRevisionCorreos() { _facDelTrig('facRevisarCorreos'); ScriptApp.newTrigger('facRevisarCorreos').timeBased().everyHours(1).create(); SpreadsheetApp.getUi().alert('✅ Revisión cada 1 hora.'); }
function facActivarRecordatorios() { _facDelTrig('facRecordatorioDiario'); ScriptApp.newTrigger('facRecordatorioDiario').timeBased().everyDays(1).atHour(FAC_CONFIG.HORA_RECORDATORIO).create(); SpreadsheetApp.getUi().alert('✅ Recordatorio diario a las '+FAC_CONFIG.HORA_RECORDATORIO+':00.'); }
function facActivarAlertaCritica() { _facDelTrig('facAlertaCritica'); ScriptApp.newTrigger('facAlertaCritica').timeBased().everyHours(3).create(); SpreadsheetApp.getUi().alert('✅ Alerta crítica cada 3 horas.'); }
function facActivarTodo() {
  _facDelTrig('facRevisarCorreos'); _facDelTrig('facRecordatorioDiario'); _facDelTrig('facAlertaCritica');
  ScriptApp.newTrigger('facRevisarCorreos').timeBased().everyHours(1).create();
  ScriptApp.newTrigger('facRecordatorioDiario').timeBased().everyDays(1).atHour(FAC_CONFIG.HORA_RECORDATORIO).create();
  ScriptApp.newTrigger('facAlertaCritica').timeBased().everyHours(3).create();
  facInicializarHoja();
  SpreadsheetApp.getUi().alert('🚀 TODO activado.');
}
function facDesactivarTodo() { _facDelTrig('facRevisarCorreos'); _facDelTrig('facRecordatorioDiario'); _facDelTrig('facAlertaCritica'); SpreadsheetApp.getUi().alert('🚫 Todo desactivado.'); }
function _facDelTrig(fn) { ScriptApp.getProjectTriggers().forEach(function(t){if(t.getHandlerFunction()===fn)ScriptApp.deleteTrigger(t);}); }
/*****************************************************************
 * 05_TASK_MANAGER.gs
 * Task Manager integrado al menú unificado
 *****************************************************************/

var TM_CONFIG = {
  EMAIL_DESTINO: (typeof SYS_CFG !== 'undefined' ? SYS_CFG.DEFAULTS.EMAIL_DEMO : 'usuario.demo@empresa.com'),
  NOMBRE_HOJA_TAREAS: (typeof SYS_CFG !== 'undefined' ? SYS_CFG.SHEETS.TAREAS : 'TAREAS'),
  NOMBRE_HOJA_COMPLETADAS: (typeof SYS_CFG !== 'undefined' ? SYS_CFG.SHEETS.COMPLETADAS : 'Completadas'),
  NOMBRE_HOJA_CONFIG: (typeof SYS_CFG !== 'undefined' ? SYS_CFG.SHEETS.CONFIG : 'Configuración'),
  NOMBRE_HOJA_DASHBOARD: (typeof SYS_CFG !== 'undefined' ? SYS_CFG.SHEETS.DASHBOARD : 'Dashboard'),
  NOMBRE_HOJA_LOG: (typeof SYS_CFG !== 'undefined' ? SYS_CFG.SHEETS.LOG_CORREOS : 'Log Correos'),
  HORA_ENVIO: 7,
  HORA_ENVIO_SEMANAL: 9,
  ZONA_HORARIA: (typeof SYS_getTz_ === 'function' ? SYS_getTz_() : 'America/Guayaquil'),
  WHATSAPP_ID_INSTANCE: '',
  WHATSAPP_API_TOKEN: ''
};

var TM_TRIGGER_DAILY_HANDLER = '_tmTriggerResumenDiario';
var TM_TRIGGER_WEEKLY_HANDLER = '_tmTriggerResumenSemanal';

function instalarMenuTaskManager() {
  crearMenuSistema();
  SpreadsheetApp.getUi().alert('✅ Task Manager integrado al menú unificado.');
}

function desinstalarMenuTaskManager() {
  var n = 0;
  ScriptApp.getProjectTriggers().forEach(function(t) {
    if (t.getHandlerFunction() === 'crearMenuTaskManager') {
      ScriptApp.deleteTrigger(t);
      n++;
    }
  });
  SpreadsheetApp.getUi().alert('🚫 Limpieza hecha. Triggers legacy eliminados: ' + n);
}

function crearMenuTaskManager() {
  return crearMenuSistema();
}

function inicializarHojas() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var ht = ss.getSheetByName(TM_CONFIG.NOMBRE_HOJA_TAREAS) || ss.insertSheet(TM_CONFIG.NOMBRE_HOJA_TAREAS);
  ht.getRange(1,1,1,14).setValues([['ID','Tarea','Descripción','Categoría','Criticidad','Frecuencia','Fecha Creación','Fecha Vencimiento','Hora Recordatorio','Día Semana','Día Mes','Estado','Notas','Última Notificación']]);
  var hc = ss.getSheetByName(TM_CONFIG.NOMBRE_HOJA_COMPLETADAS) || ss.insertSheet(TM_CONFIG.NOMBRE_HOJA_COMPLETADAS);
  hc.getRange(1,1,1,11).setValues([['ID','Tarea','Descripción','Categoría','Criticidad','Frecuencia','Fecha Creación','Fecha Vencimiento','Fecha Completada','Tiempo Resolución (días)','Notas']]);
  var hcfg = ss.getSheetByName(TM_CONFIG.NOMBRE_HOJA_CONFIG) || ss.insertSheet(TM_CONFIG.NOMBRE_HOJA_CONFIG);
  hcfg.getRange('A1').setValue('CONFIGURACIÓN TASK MANAGER');
  hcfg.getRange('A3').setValue('Correo Destino:'); hcfg.getRange('B3').setValue(TM_CONFIG.EMAIL_DESTINO);
  hcfg.getRange('A4').setValue('Hora Envío Diario:'); hcfg.getRange('B4').setValue(TM_CONFIG.HORA_ENVIO);
  hcfg.getRange('A5').setValue('Zona Horaria:'); hcfg.getRange('B5').setValue(TM_CONFIG.ZONA_HORARIA);
  hcfg.getRange('A6').setValue('WA ID Instance:'); hcfg.getRange('C6').setValue('← console.green-api.com');
  hcfg.getRange('A7').setValue('WA API Token:'); hcfg.getRange('C7').setValue('← console.green-api.com');
  hcfg.getRange('A8').setValue('WA Chat ID:'); hcfg.getRange('C8').setValue('← Ej: 593900000000@c.us');
  hcfg.getRange('A9').setValue('CATEGORÍAS:');
  ['Universidad','Trabajo','Personal','Salud/Fitness','Farmacia','Trámites','Proyectos','Finanzas','Otro','FAVORES'].forEach(function(c,i){hcfg.getRange(10+i,1).setValue(c);});
  if (!ss.getSheetByName(TM_CONFIG.NOMBRE_HOJA_DASHBOARD)) ss.insertSheet(TM_CONFIG.NOMBRE_HOJA_DASHBOARD);
  var hl = ss.getSheetByName(TM_CONFIG.NOMBRE_HOJA_LOG) || ss.insertSheet(TM_CONFIG.NOMBRE_HOJA_LOG);
  hl.getRange(1,1,1,4).setValues([['Fecha Envío','Destinatario','Asunto','Estado']]);
  aplicarFormato();
  SpreadsheetApp.getUi().alert('✅ Hojas inicializadas correctamente.');
}

function aplicarFormato() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var ht = ss.getSheetByName(TM_CONFIG.NOMBRE_HOJA_TAREAS);
  if (ht && ht.getLastRow() >= 1) {
    ht.getRange(1,1,1,14).setBackground('#1a73e8').setFontColor('#fff').setFontWeight('bold').setHorizontalAlignment('center').setWrap(true);
    ht.setFrozenRows(1);
    [60,250,300,120,100,100,130,130,120,100,80,100,200,140].forEach(function(w,i){ht.setColumnWidth(i+1,w);});
    colorearPorCriticidad(ht);
  }
  var hc = ss.getSheetByName(TM_CONFIG.NOMBRE_HOJA_COMPLETADAS);
  if (hc && hc.getLastRow() >= 1) { hc.getRange(1,1,1,11).setBackground('#34a853').setFontColor('#fff').setFontWeight('bold').setHorizontalAlignment('center').setWrap(true); hc.setFrozenRows(1); }
  var hl = ss.getSheetByName(TM_CONFIG.NOMBRE_HOJA_LOG);
  if (hl && hl.getLastRow() >= 1) { hl.getRange(1,1,1,4).setBackground('#f4511e').setFontColor('#fff').setFontWeight('bold').setHorizontalAlignment('center'); hl.setFrozenRows(1); }
}

function colorearPorCriticidad(hoja) {
  var lr = hoja.getLastRow();
  if (lr < 2) return;
  var datos = hoja.getRange(2, 1, lr - 1, 14).getValues();
  var matrix = datos.map(function(f) {
    var color = '#ffffff';
    if (f[11] === 'Completada') color = '#e8f5e9';
    else color = {'Crítica':'#ffebee','Alta':'#fff3e0','Media':'#fffde7','Baja':'#e8f5e9'}[f[4]] || '#ffffff';
    var row = [];
    for (var i = 0; i < 14; i++) row.push(color);
    return row;
  });
  hoja.getRange(2, 1, lr - 1, 14).setBackgrounds(matrix);
}

function obtenerCategorias() {
  var hc = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(TM_CONFIG.NOMBRE_HOJA_CONFIG);
  if (!hc) return ['Universidad','Trabajo','Personal','Otro'];
  var cats = [];
  for (var i = 10; i <= hc.getLastRow(); i++) {
    var v = hc.getRange(i,1).getValue();
    if (v && String(v).trim()) cats.push(String(v).trim());
  }
  return cats.length ? cats : ['General'];
}

function gestionarCategorias() {
  var ui = SpreadsheetApp.getUi();
  var cats = obtenerCategorias();
  var resp = ui.prompt('📂 Categorías', 'Actuales:\n' + cats.map(function(c,i){return (i+1)+'. '+c;}).join('\n') + '\n\nEscribe nueva o "eliminar:N"', ui.ButtonSet.OK_CANCEL);
  if (resp.getSelectedButton() !== ui.Button.OK) return;
  var input = resp.getResponseText().trim();
  var hcfg = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(TM_CONFIG.NOMBRE_HOJA_CONFIG);
  if (input.toLowerCase().startsWith('eliminar:')) {
    var idx = parseInt(input.split(':')[1], 10) - 1;
    if (idx >= 0 && idx < cats.length) {
      var remain = cats.filter(function(_,i){return i !== idx;});
      for (var i = 0; i < 20; i++) hcfg.getRange(10+i,1).setValue(i < remain.length ? remain[i] : '');
      ui.alert('🗑️ Eliminada: ' + cats[idx]);
    }
  } else if (input) {
    hcfg.getRange(10 + cats.length, 1).setValue(input);
    ui.alert('✅ Agregada: ' + input);
  }
}

function mostrarFormularioNuevaTarea() {
  var cats = obtenerCategorias();
  var opts = cats.map(function(c){return '<option value="'+c+'">'+c+'</option>';}).join('');
  var html = '<html><head><style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:"Segoe UI",Arial,sans-serif;padding:20px;background:#f8f9fa}h2{color:#1a73e8;margin-bottom:16px;font-size:18px}.fg{margin-bottom:14px}label{display:block;font-weight:600;margin-bottom:4px;color:#333;font-size:13px}input,select,textarea{width:100%;padding:8px 10px;border:1px solid #dadce0;border-radius:6px;font-size:13px}textarea{resize:vertical;min-height:60px}.row{display:flex;gap:10px}.row .fg{flex:1}.btn{padding:10px 24px;border:none;border-radius:6px;font-size:14px;font-weight:600;cursor:pointer}.bp{background:#1a73e8;color:#fff}.bc{background:#e0e0e0;color:#333;margin-right:10px}.acts{text-align:right;margin-top:18px}.fc{display:none;padding:10px;background:#e3f2fd;border-radius:6px;margin-top:6px}.fc.active{display:block}#st{margin-top:10px;padding:8px;border-radius:6px;display:none;font-size:13px}</style></head><body>' +
    '<h2>📋 Nueva Tarea</h2>' +
    '<div class="fg"><label>📌 Nombre *</label><input type="text" id="tarea" placeholder="Nombre de la tarea"></div>' +
    '<div class="fg"><label>📝 Descripción</label><textarea id="desc" placeholder="Detalles..."></textarea></div>' +
    '<div class="row"><div class="fg"><label>📂 Categoría</label><select id="cat">' + opts + '</select></div>' +
    '<div class="fg"><label>🚨 Criticidad</label><select id="crit"><option value="Baja">🟢 Baja</option><option value="Media" selected>🟡 Media</option><option value="Alta">🟠 Alta</option><option value="Crítica">🔴 Crítica</option></select></div></div>' +
    '<div class="row"><div class="fg"><label>🔄 Frecuencia</label><select id="freq" onchange="tfc()"><option value="Única">Única</option><option value="Diaria">Diaria</option><option value="Semanal">Semanal</option><option value="Mensual">Mensual</option></select></div>' +
    '<div class="fg"><label>📅 Vencimiento</label><input type="date" id="fv"></div></div>' +
    '<div id="cSem" class="fc"><label>Día semana</label><select id="dSem"><option>Lunes</option><option>Martes</option><option>Miércoles</option><option>Jueves</option><option>Viernes</option><option>Sábado</option><option>Domingo</option></select></div>' +
    '<div id="cMes" class="fc"><label>Día mes (1-31)</label><input type="number" id="dMes" min="1" max="31" value="1"></div>' +
    '<div class="fg"><label>⏰ Hora</label><input type="time" id="hora" value="08:00"></div>' +
    '<div class="fg"><label>📎 Notas</label><textarea id="notas" placeholder="Links, referencias..."></textarea></div>' +
    '<div class="acts"><button class="btn bc" onclick="google.script.host.close()">Cancelar</button><button class="btn bp" onclick="guardar()">💾 Guardar</button></div>' +
    '<div id="st"></div>' +
    '<script>function tfc(){var f=document.getElementById("freq").value;document.getElementById("cSem").className="fc"+(f==="Semanal"?" active":"");document.getElementById("cMes").className="fc"+(f==="Mensual"?" active":"")}function guardar(){var t=document.getElementById("tarea").value.trim();if(!t){ss("⚠️ Nombre obligatorio","#fff3e0");return}google.script.run.withSuccessHandler(function(){ss("✅ Guardada","#e8f5e9");setTimeout(function(){google.script.host.close()},1200)}).withFailureHandler(function(e){ss("❌ "+e.message,"#ffebee")}).guardarNuevaTarea({tarea:t,descripcion:document.getElementById("desc").value.trim(),categoria:document.getElementById("cat").value,criticidad:document.getElementById("crit").value,frecuencia:document.getElementById("freq").value,fechaVenc:document.getElementById("fv").value,horaRecordatorio:document.getElementById("hora").value,diaSemana:document.getElementById("dSem").value,diaMes:document.getElementById("dMes").value,notas:document.getElementById("notas").value.trim()})}function ss(m,b){var e=document.getElementById("st");e.textContent=m;e.style.background=b;e.style.display="block"}document.getElementById("fv").valueAsDate=new Date();</script></body></html>';
  SpreadsheetApp.getUi().showModalDialog(HtmlService.createHtmlOutput(html).setWidth(520).setHeight(680), '➕ Nueva Tarea');
}

function guardarNuevaTarea(d) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var h = ss.getSheetByName(TM_CONFIG.NOMBRE_HOJA_TAREAS);
  if (!h) { inicializarHojas(); h = ss.getSheetByName(TM_CONFIG.NOMBRE_HOJA_TAREAS); }
  var id = 'T' + Utilities.formatDate(new Date(), TM_CONFIG.ZONA_HORARIA, 'yyyyMMddHHmmss') + Math.floor(Math.random()*100);
  var fv = d.fechaVenc ? new Date(d.fechaVenc + 'T23:59:59') : '';
  h.appendRow([id, d.tarea, d.descripcion, d.categoria, d.criticidad, d.frecuencia, new Date(), fv, d.horaRecordatorio, d.frecuencia==='Semanal'?d.diaSemana:'', d.frecuencia==='Mensual'?d.diaMes:'', 'Pendiente', d.notas, '']);
  colorearPorCriticidad(h);
}

function _tmObtenerTareasParaSelector() {
  var h = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(TM_CONFIG.NOMBRE_HOJA_TAREAS);
  if (!h || h.getLastRow() < 2) return [];
  var d = h.getRange(2,1,h.getLastRow()-1,14).getValues();
  var ci = {'Crítica':'🔴','Alta':'🟠','Media':'🟡','Baja':'🟢'};
  return d.map(function(f,i){return {fila:i+2,id:f[0],tarea:f[1],descripcion:f[2],categoria:f[3],criticidad:f[4],critIcono:ci[f[4]]||'⚪',frecuencia:f[5],fechaVenc:f[7]?Utilities.formatDate(new Date(f[7]),TM_CONFIG.ZONA_HORARIA,'dd/MM/yyyy'):'',estado:f[11],notas:f[12]};}).filter(function(t){return t.estado==='Pendiente';});
}

function _tmGetSelectorCSS() {
  return '*{box-sizing:border-box;margin:0;padding:0}body{font-family:"Segoe UI",Arial,sans-serif;padding:16px;background:#f8f9fa}h2{color:#1a73e8;margin-bottom:12px;font-size:17px}.sb{width:100%;padding:10px 12px;border:2px solid #dadce0;border-radius:8px;font-size:14px;margin-bottom:12px}.sb:focus{border-color:#1a73e8;outline:none}.tl{max-height:380px;overflow-y:auto}.ti{display:flex;align-items:center;padding:10px 12px;border:1px solid #e0e0e0;border-radius:8px;margin-bottom:6px;cursor:pointer;transition:all .15s;background:#fff}.ti:hover{border-color:#1a73e8;background:#e8f0fe}.ti.sel{border-color:#1a73e8;background:#d2e3fc}.tr{margin-right:10px;width:18px;height:18px;accent-color:#1a73e8}.tinfo{flex:1}.tn{font-weight:600;font-size:13px;color:#202124}.tm{font-size:11px;color:#5f6368;margin-top:2px}.tc{display:inline-block;padding:1px 7px;border-radius:10px;font-size:10px;font-weight:700;color:#fff;margin-right:6px}.cc{background:#d32f2f}.ca{background:#e65100}.cm{background:#f9a825;color:#333}.cb{background:#2e7d32}.acts{display:flex;justify-content:flex-end;gap:8px;margin-top:14px;padding-top:12px;border-top:1px solid #e0e0e0}.btn{padding:9px 22px;border:none;border-radius:6px;font-size:13px;font-weight:600;cursor:pointer}.bp{background:#1a73e8;color:#fff}.bd{background:#d32f2f;color:#fff}.bs{background:#2e7d32;color:#fff}.bc{background:#e0e0e0;color:#333}.btn:disabled{opacity:.5;cursor:not-allowed}#st{margin-top:10px;padding:8px;border-radius:6px;display:none;font-size:13px;text-align:center}.cnt{font-size:12px;color:#5f6368;margin-bottom:8px}';
}

function _tmGetSearchJS() {
  return 'function filtrar(){var t=document.getElementById("buscar").value.toLowerCase();document.querySelectorAll(".ti").forEach(function(i){var n=i.dataset.nombre.toLowerCase();i.style.display=n.includes(t)?"flex":"none"});document.getElementById("cnt").textContent=document.querySelectorAll(".ti:not([style*=none])").length+" tareas"}function seleccionar(f,el){document.querySelectorAll(".ti").forEach(function(i){i.classList.remove("sel")});document.querySelectorAll(".tr").forEach(function(r){r.checked=false});el.classList.add("sel");el.querySelector(".tr").checked=true;window._fs=f;document.querySelectorAll(".ba").forEach(function(b){b.disabled=false})}function ss(m,b){var e=document.getElementById("st");e.textContent=m;e.style.background=b;e.style.display="block"}';
}

function _tmBuildItem(t) {
  var cc = (t.criticidad||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
  return '<div class="ti" data-nombre="'+t.tarea+'" onclick="seleccionar('+t.fila+',this)"><input type="radio" name="t" class="tr"><div class="tinfo"><div class="tn"><span class="tc c'+cc[0]+'">'+(t.critIcono||'')+' '+t.criticidad+'</span>'+t.tarea+'</div><div class="tm">📂 '+(t.categoria||'-')+' · 🔄 '+(t.frecuencia||'-')+' · 📅 '+(t.fechaVenc||'Sin fecha')+'</div></div></div>';
}

function marcarCompletada() {
  var tareas = _tmObtenerTareasParaSelector();
  if (!tareas.length) { mostrarAlerta('🎉 No hay tareas pendientes.'); return; }
  var items = tareas.map(_tmBuildItem).join('');
  var html = '<html><head><style>'+_tmGetSelectorCSS()+'</style></head><body><h2>✅ Completar Tarea</h2><input type="text" class="sb" id="buscar" placeholder="🔍 Buscar..." oninput="filtrar()"><div class="cnt" id="cnt">'+tareas.length+' tareas</div><div class="tl">'+items+'</div><div class="acts"><button class="btn bc" onclick="google.script.host.close()">Cancelar</button><button class="btn bs ba" disabled onclick="comp()">✅ Completar</button></div><div id="st"></div><script>'+_tmGetSearchJS()+'function comp(){if(!window._fs)return;document.querySelectorAll(".ba").forEach(function(b){b.disabled=true});ss("⏳...","#e3f2fd");google.script.run.withSuccessHandler(function(m){ss(m,"#e8f5e9");setTimeout(function(){google.script.host.close()},1500)}).withFailureHandler(function(e){ss("❌ "+e.message,"#ffebee");document.querySelectorAll(".ba").forEach(function(b){b.disabled=false})})._tmCompletarPorFila(window._fs)}</script></body></html>';
  SpreadsheetApp.getUi().showModalDialog(HtmlService.createHtmlOutput(html).setWidth(540).setHeight(560), '✅ Completar');
}

function _tmCompletarPorFila(fila) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var h = ss.getSheetByName(TM_CONFIG.NOMBRE_HOJA_TAREAS);
  var d = h.getRange(fila,1,1,14).getValues()[0];
  var ahora = new Date();
  var fc = d[6] ? new Date(d[6]) : ahora;
  var dias = Math.ceil((ahora - fc) / 86400000);
  var hc = ss.getSheetByName(TM_CONFIG.NOMBRE_HOJA_COMPLETADAS);
  if (!hc) { inicializarHojas(); hc = ss.getSheetByName(TM_CONFIG.NOMBRE_HOJA_COMPLETADAS); }
  hc.appendRow([d[0],d[1],d[2],d[3],d[4],d[5],d[6],d[7],ahora,dias,d[12]]);
  if (['Diaria','Semanal','Mensual'].indexOf(d[5]) !== -1) {
    var nf = _tmCalcProxFecha(d[5],d[9],d[10]);
    h.getRange(fila,8).setValue(nf);
    h.getRange(fila,12).setValue('Pendiente');
    colorearPorCriticidad(h);
    return '✅ Completada: "'+d[1]+'". Próxima: '+Utilities.formatDate(nf,TM_CONFIG.ZONA_HORARIA,'dd/MM/yyyy');
  }
  h.deleteRow(fila); colorearPorCriticidad(h);
  return '✅ Completada y archivada: "'+d[1]+'"';
}

function _tmCalcProxFecha(freq, diaSem, diaMes) {
  var n = new Date();
  if (freq === 'Diaria') n.setDate(n.getDate()+1);
  else if (freq === 'Semanal') n.setDate(n.getDate()+7);
  else if (freq === 'Mensual') { n.setMonth(n.getMonth()+1); if (diaMes) n.setDate(parseInt(diaMes,10)); }
  return n;
}

function reactivarTarea() {
  var hc = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(TM_CONFIG.NOMBRE_HOJA_COMPLETADAS);
  if (!hc || hc.getLastRow() < 2) { mostrarAlerta('No hay completadas.'); return; }
  var d = hc.getRange(2,1,hc.getLastRow()-1,11).getValues();
  var items = d.map(function(f,i) {
    return '<div class="ti" data-nombre="'+f[1]+'" onclick="seleccionar('+(i+2)+',this)"><input type="radio" name="t" class="tr"><div class="tinfo"><div class="tn">'+f[1]+'</div><div class="tm">📂 '+(f[3]||'-')+' · ✅ '+(f[8]?Utilities.formatDate(new Date(f[8]),TM_CONFIG.ZONA_HORARIA,'dd/MM/yyyy'):'')+'</div></div></div>';
  }).join('');
  var html = '<html><head><style>'+_tmGetSelectorCSS()+'</style></head><body><h2>🔄 Reactivar</h2><input type="text" class="sb" id="buscar" placeholder="🔍 Buscar..." oninput="filtrar()"><div class="cnt" id="cnt">'+d.length+' tareas</div><div class="tl">'+items+'</div><div class="acts"><button class="btn bc" onclick="google.script.host.close()">Cancelar</button><button class="btn bp ba" disabled onclick="react()">🔄 Reactivar</button></div><div id="st"></div><script>'+_tmGetSearchJS()+'function react(){if(!window._fs)return;document.querySelectorAll(".ba").forEach(function(b){b.disabled=true});ss("⏳...","#e3f2fd");google.script.run.withSuccessHandler(function(m){ss(m,"#e8f5e9");setTimeout(function(){google.script.host.close()},1500)}).withFailureHandler(function(e){ss("❌ "+e.message,"#ffebee")})._tmReactivarPorFila(window._fs)}</script></body></html>';
  SpreadsheetApp.getUi().showModalDialog(HtmlService.createHtmlOutput(html).setWidth(540).setHeight(520), '🔄 Reactivar');
}

function _tmReactivarPorFila(fila) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var hc = ss.getSheetByName(TM_CONFIG.NOMBRE_HOJA_COMPLETADAS);
  var d = hc.getRange(fila,1,1,11).getValues()[0];
  var ht = ss.getSheetByName(TM_CONFIG.NOMBRE_HOJA_TAREAS);
  ht.appendRow([d[0],d[1],d[2],d[3],d[4],d[5],new Date(),'','','','','Pendiente',d[10],'']);
  hc.deleteRow(fila); colorearPorCriticidad(ht);
  return '🔄 Reactivada: "'+d[1]+'"';
}

function editarTarea() {
  var tareas = _tmObtenerTareasParaSelector();
  if (!tareas.length) { mostrarAlerta('No hay tareas.'); return; }
  var items = tareas.map(_tmBuildItem).join('');
  var catsJSON = JSON.stringify(obtenerCategorias());
  var html = '<html><head><style>'+_tmGetSelectorCSS()+'.ep{display:none;padding:14px;background:#fff;border:2px solid #1a73e8;border-radius:10px;margin-top:12px}.ep.active{display:block}.ep .fg{margin-bottom:10px}.ep label{display:block;font-weight:600;margin-bottom:3px;font-size:12px}.ep input,.ep select,.ep textarea{width:100%;padding:7px 10px;border:1px solid #dadce0;border-radius:6px;font-size:13px}.ep textarea{min-height:50px;resize:vertical}.ep .row{display:flex;gap:8px}.ep .row .fg{flex:1}</style></head><body><h2>✏️ Editar</h2><input type="text" class="sb" id="buscar" placeholder="🔍 Buscar..." oninput="filtrar()"><div class="cnt" id="cnt">'+tareas.length+' tareas</div><div class="tl" id="lc">'+items+'</div><div class="ep" id="ep"><h3 style="color:#1a73e8;margin-bottom:10px;font-size:14px">📝 Editar</h3><div class="fg"><label>Nombre</label><input type="text" id="en"></div><div class="fg"><label>Descripción</label><textarea id="ed"></textarea></div><div class="row"><div class="fg"><label>Categoría</label><select id="ec"><option value="">— Mantener —</option></select></div><div class="fg"><label>Criticidad</label><select id="ecr"><option value="">— Mantener —</option><option value="Baja">Baja</option><option value="Media">Media</option><option value="Alta">Alta</option><option value="Crítica">Crítica</option></select></div></div><div class="row"><div class="fg"><label>Fecha Venc.</label><input type="date" id="ef"></div><div class="fg"><label>Frecuencia</label><select id="efr"><option value="">— Mantener —</option><option value="Única">Única</option><option value="Diaria">Diaria</option><option value="Semanal">Semanal</option><option value="Mensual">Mensual</option></select></div></div><div class="fg"><label>Notas</label><textarea id="eno"></textarea></div></div><div class="acts"><button class="btn bc" onclick="google.script.host.close()">Cancelar</button><button class="btn bp ba" disabled onclick="guardar()">💾 Guardar</button></div><div id="st"></div><script>'+_tmGetSearchJS()+'var cats='+catsJSON+';var sc=document.getElementById("ec");cats.forEach(function(c){var o=document.createElement("option");o.value=c;o.textContent=c;sc.appendChild(o)});var _os=seleccionar;seleccionar=function(f,el){_os(f,el);document.getElementById("ep").classList.add("active");document.getElementById("lc").style.maxHeight="180px";["en","ed","eno"].forEach(function(id){document.getElementById(id).value=""});["ecr","efr","ec"].forEach(function(id){document.getElementById(id).value=""});document.getElementById("ef").value=""};function guardar(){if(!window._fs)return;var c={nombre:document.getElementById("en").value.trim(),descripcion:document.getElementById("ed").value.trim(),categoria:document.getElementById("ec").value,criticidad:document.getElementById("ecr").value,frecuencia:document.getElementById("efr").value,fechaVenc:document.getElementById("ef").value,notas:document.getElementById("eno").value.trim()};document.querySelectorAll(".ba").forEach(function(b){b.disabled=true});ss("⏳...","#e3f2fd");google.script.run.withSuccessHandler(function(m){ss(m,"#e8f5e9");setTimeout(function(){google.script.host.close()},1500)}).withFailureHandler(function(e){ss("❌ "+e.message,"#ffebee");document.querySelectorAll(".ba").forEach(function(b){b.disabled=false})})._tmEditarPorFila(window._fs,c)}</script></body></html>';
  SpreadsheetApp.getUi().showModalDialog(HtmlService.createHtmlOutput(html).setWidth(560).setHeight(680), '✏️ Editar');
}

function _tmEditarPorFila(fila, c) {
  var h = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(TM_CONFIG.NOMBRE_HOJA_TAREAS);
  if (c.nombre) h.getRange(fila,2).setValue(c.nombre);
  if (c.descripcion) h.getRange(fila,3).setValue(c.descripcion);
  if (c.categoria) h.getRange(fila,4).setValue(c.categoria);
  if (c.criticidad && ['Baja','Media','Alta','Crítica'].indexOf(c.criticidad)!==-1) h.getRange(fila,5).setValue(c.criticidad);
  if (c.frecuencia) h.getRange(fila,6).setValue(c.frecuencia);
  if (c.fechaVenc) h.getRange(fila,8).setValue(new Date(c.fechaVenc+'T23:59:59'));
  if (c.notas) h.getRange(fila,13).setValue(c.notas);
  colorearPorCriticidad(h);
  return '✅ Actualizada: "'+(c.nombre||h.getRange(fila,2).getValue())+'"';
}

function eliminarTarea() {
  var tareas = _tmObtenerTareasParaSelector();
  if (!tareas.length) { mostrarAlerta('No hay tareas.'); return; }
  var items = tareas.map(_tmBuildItem).join('');
  var html = '<html><head><style>'+_tmGetSelectorCSS()+'.wb{background:#fff3e0;border:1px solid #ffb74d;border-radius:8px;padding:10px;margin-top:10px;font-size:12px;color:#e65100;display:none}.wb.active{display:block}</style></head><body><h2>🗑️ Eliminar</h2><input type="text" class="sb" id="buscar" placeholder="🔍 Buscar..." oninput="filtrar()"><div class="cnt" id="cnt">'+tareas.length+' tareas</div><div class="tl">'+items+'</div><div class="wb" id="wb">⚠️ Acción permanente. No se puede deshacer.</div><div class="acts"><button class="btn bc" onclick="google.script.host.close()">Cancelar</button><button class="btn bd ba" disabled onclick="del()">🗑️ Eliminar</button></div><div id="st"></div><script>'+_tmGetSearchJS()+'var _os2=seleccionar;seleccionar=function(f,el){_os2(f,el);document.getElementById("wb").classList.add("active")};function del(){if(!window._fs)return;document.querySelectorAll(".ba").forEach(function(b){b.disabled=true});ss("⏳...","#ffebee");google.script.run.withSuccessHandler(function(m){ss(m,"#e8f5e9");setTimeout(function(){google.script.host.close()},1500)}).withFailureHandler(function(e){ss("❌ "+e.message,"#ffebee")})._tmEliminarPorFila(window._fs)}</script></body></html>';
  SpreadsheetApp.getUi().showModalDialog(HtmlService.createHtmlOutput(html).setWidth(540).setHeight(520), '🗑️ Eliminar');
}

function _tmEliminarPorFila(fila) {
  var h = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(TM_CONFIG.NOMBRE_HOJA_TAREAS);
  var n = h.getRange(fila,2).getValue();
  h.deleteRow(fila); colorearPorCriticidad(h);
  return '🗑️ Eliminada: "'+n+'"';
}

function verTareasPendientes() { mostrarVisualizacion('📌 PENDIENTES', _tmGetByEstado('Pendiente')); }
function verTareasCompletadas() { SpreadsheetApp.getActiveSpreadsheet().getSheetByName(TM_CONFIG.NOMBRE_HOJA_COMPLETADAS).activate(); mostrarAlerta('✅ Hoja de Completadas.'); }

function verTareasVencidas() {
  var h = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(TM_CONFIG.NOMBRE_HOJA_TAREAS);
  if (!h || h.getLastRow()<2) { mostrarAlerta('No hay tareas.'); return; }
  var ahora = new Date();
  mostrarVisualizacion('⚠️ VENCIDAS', h.getRange(2,1,h.getLastRow()-1,14).getValues().filter(function(f){ return f[11]==='Pendiente' && f[7] && new Date(f[7]) < ahora; }));
}

function verTareasHoy() {
  var h = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(TM_CONFIG.NOMBRE_HOJA_TAREAS);
  if (!h || h.getLastRow()<2) { mostrarAlerta('No hay tareas.'); return; }
  mostrarVisualizacion('📅 HOY', _tmFilterHoy(h.getRange(2,1,h.getLastRow()-1,14).getValues()));
}

function verTareasEstaSemana() {
  var h = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(TM_CONFIG.NOMBRE_HOJA_TAREAS);
  if (!h || h.getLastRow()<2) { mostrarAlerta('No hay tareas.'); return; }
  var ahora = new Date(), fin = new Date(ahora); fin.setDate(ahora.getDate()+(7-ahora.getDay()));
  mostrarVisualizacion('📆 ESTA SEMANA', h.getRange(2,1,h.getLastRow()-1,14).getValues().filter(function(f){ if(f[11]!=='Pendiente')return false; if(f[5]==='Diaria'||f[5]==='Semanal')return true; return f[7] && new Date(f[7])>=ahora && new Date(f[7])<=fin; }));
}

function _tmGetByEstado(est) {
  var h = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(TM_CONFIG.NOMBRE_HOJA_TAREAS);
  if (!h || h.getLastRow()<2) return [];
  return h.getRange(2,1,h.getLastRow()-1,14).getValues().filter(function(f){return f[11]===est;});
}

function _tmFilterHoy(datos) {
  var ahora = new Date(), hoy = Utilities.formatDate(ahora, TM_CONFIG.ZONA_HORARIA, 'yyyy-MM-dd');
  var dias = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];
  return datos.filter(function(f) {
    if (f[11] !== 'Pendiente') return false;
    if (f[5] === 'Diaria') return true;
    if (f[7] && Utilities.formatDate(new Date(f[7]), TM_CONFIG.ZONA_HORARIA, 'yyyy-MM-dd') === hoy) return true;
    if (f[5] === 'Semanal' && f[9] === dias[ahora.getDay()]) return true;
    if (f[5] === 'Mensual' && parseInt(f[10],10) === ahora.getDate()) return true;
    return false;
  });
}

function mostrarVisualizacion(titulo, tareas) {
  if (!tareas.length) { mostrarAlerta(titulo + '\n\n🎉 No hay tareas.'); return; }
  var ahora = new Date();
  var oc = {'Crítica':0,'Alta':1,'Media':2,'Baja':3};
  tareas.sort(function(a,b){return (oc[a[4]]||99)-(oc[b[4]]||99);});
  var rows = tareas.map(function(t){
    var v = t[7] && new Date(t[7]) < ahora;
    var fv = t[7] ? Utilities.formatDate(new Date(t[7]),TM_CONFIG.ZONA_HORARIA,'dd/MM/yyyy') : '-';
    return '<tr'+(v?' style="background:#ffebee"':'')+'><td><strong>'+t[1]+'</strong>'+(t[2]?'<br><small>'+String(t[2]).substring(0,60)+'</small>':'')+'</td><td>'+t[3]+'</td><td>'+t[4]+'</td><td>'+t[5]+'</td><td>'+fv+(v?' ⚠️':'')+'</td></tr>';
  }).join('');
  var html = '<html><head><style>body{font-family:"Segoe UI",sans-serif;padding:16px;background:#f8f9fa}h2{color:#1a73e8;border-bottom:2px solid #1a73e8;padding-bottom:8px;font-size:16px}table{width:100%;border-collapse:collapse;font-size:12px;margin-top:10px}th{background:#1a73e8;color:#fff;padding:8px;text-align:left}td{padding:6px 8px;border-bottom:1px solid #e0e0e0}.s{background:#e3f2fd;padding:10px;border-radius:8px;margin:10px 0;font-size:13px}</style></head><body><h2>'+titulo+'</h2><div class="s">Total: <strong>'+tareas.length+'</strong> | 🔴 '+tareas.filter(function(t){return t[4]==='Crítica';}).length+' | 🟠 '+tareas.filter(function(t){return t[4]==='Alta';}).length+' | 🟡 '+tareas.filter(function(t){return t[4]==='Media';}).length+' | 🟢 '+tareas.filter(function(t){return t[4]==='Baja';}).length+'</div><table><tr><th>Tarea</th><th>Cat.</th><th>Crit.</th><th>Freq.</th><th>Venc.</th></tr>'+rows+'</table></body></html>';
  SpreadsheetApp.getUi().showModalDialog(HtmlService.createHtmlOutput(html).setWidth(700).setHeight(500), titulo);
}

function generarDashboard() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var ht = ss.getSheetByName(TM_CONFIG.NOMBRE_HOJA_TAREAS);
  var hc = ss.getSheetByName(TM_CONFIG.NOMBRE_HOJA_COMPLETADAS);
  var hd = ss.getSheetByName(TM_CONFIG.NOMBRE_HOJA_DASHBOARD) || ss.insertSheet(TM_CONFIG.NOMBRE_HOJA_DASHBOARD);
  hd.clear();
  var ahora = new Date();
  var pend = (ht && ht.getLastRow()>=2) ? ht.getRange(2,1,ht.getLastRow()-1,14).getValues().filter(function(t){return t[11]==='Pendiente';}) : [];
  var comp = (hc && hc.getLastRow()>=2) ? hc.getRange(2,1,hc.getLastRow()-1,11).getValues() : [];
  var venc = pend.filter(function(t){return t[7] && new Date(t[7]) < ahora;});
  var r = 1;
  hd.getRange(r,1).setValue('📊 DASHBOARD').setFontSize(16).setFontWeight('bold').setFontColor('#1a73e8');
  r++; hd.getRange(r,1).setValue('Actualizado: '+Utilities.formatDate(ahora,TM_CONFIG.ZONA_HORARIA,'dd/MM/yyyy HH:mm')).setFontColor('#666');
  r+=2; hd.getRange(r,1,1,3).setValues([['Métrica','Cantidad','Estado']]).setBackground('#1a73e8').setFontColor('#fff').setFontWeight('bold');
  r++; [['📌 Activas',pend.length,pend.length>10?'⚠️':'✅'],['⚠️ Vencidas',venc.length,venc.length>0?'🔴':'✅'],['🔴 Críticas',pend.filter(function(t){return t[4]==='Crítica';}).length,''],['✅ Completadas',comp.length,'📈']].forEach(function(row){hd.getRange(r,1,1,3).setValues([row]);r++;});
  hd.setColumnWidth(1,300);hd.setColumnWidth(2,150);hd.setColumnWidth(3,200);
  hd.activate(); mostrarAlerta('📊 Dashboard actualizado.');
}

function mostrarAlerta(m) { SpreadsheetApp.getUi().alert(m); }
function obtenerEmailDestino() {
  var hc = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(TM_CONFIG.NOMBRE_HOJA_CONFIG);
  if (hc) { var e = hc.getRange('B3').getValue(); if (e) return String(e).trim(); }
  return TM_CONFIG.EMAIL_DESTINO;
}

function cambiarCorreo() {
  var ui = SpreadsheetApp.getUi();
  var resp = ui.prompt('📧 Cambiar Correo', 'Actual: '+obtenerEmailDestino()+'\nNuevo:', ui.ButtonSet.OK_CANCEL);
  if (resp.getSelectedButton()===ui.Button.OK) {
    var ne = resp.getResponseText().trim();
    if (ne && ne.indexOf('@') !== -1) {
      var hc = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(TM_CONFIG.NOMBRE_HOJA_CONFIG);
      if (!hc) { inicializarHojas(); hc = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(TM_CONFIG.NOMBRE_HOJA_CONFIG); }
      hc.getRange('B3').setValue(ne); ui.alert('✅ Correo: '+ne);
    }
  }
}

function registrarLog(email, asunto, estado) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var hl = ss.getSheetByName(TM_CONFIG.NOMBRE_HOJA_LOG);
  if (!hl) { hl = ss.insertSheet(TM_CONFIG.NOMBRE_HOJA_LOG); hl.getRange(1,1,1,4).setValues([['Fecha','Destinatario','Asunto','Estado']]); }
  hl.appendRow([new Date(), email, asunto, estado]);
}

function verLogCorreos() {
  var hl = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(TM_CONFIG.NOMBRE_HOJA_LOG);
  if (hl) hl.activate(); else mostrarAlerta('No existe Log. Inicializa primero.');
}

function _tmGetConfigSheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(TM_CONFIG.NOMBRE_HOJA_CONFIG);
  if (!sh) {
    inicializarHojas();
    sh = ss.getSheetByName(TM_CONFIG.NOMBRE_HOJA_CONFIG);
  }
  return sh;
}

function _tmGetHoraEnvio_() {
  var sh = _tmGetConfigSheet_();
  var raw = sh.getRange('B4').getValue();
  var hour = parseInt(raw, 10);
  if (isNaN(hour) || hour < 0 || hour > 23) hour = TM_CONFIG.HORA_ENVIO;
  return hour;
}

function _tmGetWhatsAppConfig_() {
  var sh = _tmGetConfigSheet_();
  return {
    idInstance: String(sh.getRange('B6').getValue() || '').trim(),
    apiToken: String(sh.getRange('B7').getValue() || '').trim(),
    chatId: String(sh.getRange('B8').getValue() || '').trim()
  };
}

function _tmGetPendingTasksDetailed_() {
  var sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(TM_CONFIG.NOMBRE_HOJA_TAREAS);
  if (!sh || sh.getLastRow() < 2) return [];
  var tz = TM_CONFIG.ZONA_HORARIA || Session.getScriptTimeZone() || 'America/Guayaquil';
  var now = new Date();
  var todayKey = Utilities.formatDate(now, tz, 'yyyy-MM-dd');
  var todayWeekday = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'][now.getDay()];
  var todayMonthDay = now.getDate();
  var rows = sh.getRange(2, 1, sh.getLastRow() - 1, 14).getValues();
  return rows.map(function(r, idx) {
    var dueDate = r[7] ? new Date(r[7]) : null;
    var dueKey = dueDate ? Utilities.formatDate(dueDate, tz, 'yyyy-MM-dd') : '';
    var isPending = r[11] === 'Pendiente';
    var isOverdue = !!(isPending && dueDate && dueKey < todayKey);
    var isCritical = r[4] === 'Crítica';
    var isToday = false;
    if (isPending) {
      if (r[5] === 'Diaria') isToday = true;
      else if (dueDate && dueKey === todayKey) isToday = true;
      else if (r[5] === 'Semanal' && String(r[9] || '') === todayWeekday) isToday = true;
      else if (r[5] === 'Mensual' && parseInt(r[10], 10) === todayMonthDay) isToday = true;
    }
    return {
      rowNumber: idx + 2,
      id: r[0],
      tarea: r[1],
      descripcion: r[2],
      categoria: r[3],
      criticidad: r[4],
      frecuencia: r[5],
      fechaCreacion: r[6],
      fechaVencimiento: dueDate,
      horaRecordatorio: r[8],
      diaSemana: r[9],
      diaMes: r[10],
      estado: r[11],
      notas: r[12],
      ultimaNotificacion: r[13],
      isPending: isPending,
      isToday: isToday,
      isOverdue: isOverdue,
      isCritical: isCritical
    };
  }).filter(function(t) { return t.isPending; });
}

function _tmWeekEnd_(date) {
  var d = new Date(date);
  var day = d.getDay();
  var diff = (day === 0 ? 0 : 7 - day);
  d.setDate(d.getDate() + diff);
  d.setHours(23, 59, 59, 999);
  return d;
}

function _tmFormatDate_(d) { return !d ? 'Sin fecha' : Utilities.formatDate(new Date(d), TM_CONFIG.ZONA_HORARIA, 'dd/MM/yyyy'); }
function _tmFormatDateTime_(d) { return Utilities.formatDate(new Date(d), TM_CONFIG.ZONA_HORARIA, 'dd/MM/yyyy HH:mm'); }

function _tmSortByUrgency_(tasks) {
  var order = {'Crítica': 0, 'Alta': 1, 'Media': 2, 'Baja': 3};
  return tasks.slice().sort(function(a, b) {
    var ca = order[a.criticidad] != null ? order[a.criticidad] : 99;
    var cb = order[b.criticidad] != null ? order[b.criticidad] : 99;
    if (ca !== cb) return ca - cb;
    var da = a.fechaVencimiento ? new Date(a.fechaVencimiento).getTime() : Number.MAX_SAFE_INTEGER;
    var db = b.fechaVencimiento ? new Date(b.fechaVencimiento).getTime() : Number.MAX_SAFE_INTEGER;
    return da - db;
  });
}

function _tmBuildTaskListHtml_(tasks, emptyText) {
  if (!tasks.length) return '<p style="margin:0;color:#5f6368;">' + emptyText + '</p>';
  return '<table style="width:100%;border-collapse:collapse;font-size:12px;">' +
    '<tr><th style="text-align:left;padding:8px;background:#1a73e8;color:#fff;">Tarea</th><th style="text-align:left;padding:8px;background:#1a73e8;color:#fff;">Categoría</th><th style="text-align:left;padding:8px;background:#1a73e8;color:#fff;">Criticidad</th><th style="text-align:left;padding:8px;background:#1a73e8;color:#fff;">Vence</th></tr>' +
    tasks.map(function(t) {
      var bg = t.isOverdue ? '#ffebee' : '#ffffff';
      var desc = t.descripcion ? '<br><span style="color:#5f6368;">' + String(t.descripcion).substring(0, 120) + '</span>' : '';
      return '<tr style="background:' + bg + ';"><td style="padding:8px;border-bottom:1px solid #e0e0e0;"><strong>' + t.tarea + '</strong>' + desc + '</td><td style="padding:8px;border-bottom:1px solid #e0e0e0;">' + (t.categoria || '-') + '</td><td style="padding:8px;border-bottom:1px solid #e0e0e0;">' + (t.criticidad || '-') + '</td><td style="padding:8px;border-bottom:1px solid #e0e0e0;">' + _tmFormatDate_(t.fechaVencimiento) + '</td></tr>';
    }).join('') + '</table>';
}

function _tmBuildTaskListText_(tasks, emptyText) {
  if (!tasks.length) return '• ' + emptyText;
  return tasks.map(function(t) { return '• ' + t.tarea + ' | ' + (t.categoria || '-') + ' | ' + (t.criticidad || '-') + ' | vence: ' + _tmFormatDate_(t.fechaVencimiento); }).join('\n');
}

function _tmGetSummaryPayload_(mode) {
  var now = new Date();
  var pending = _tmGetPendingTasksDetailed_();
  var today = _tmSortByUrgency_(pending.filter(function(t) { return t.isToday; }));
  var overdue = _tmSortByUrgency_(pending.filter(function(t) { return t.isOverdue; }));
  var critical = _tmSortByUrgency_(pending.filter(function(t) { return t.isCritical; }));
  var weekEnd = _tmWeekEnd_(now);
  var weekly = _tmSortByUrgency_(pending.filter(function(t) {
    if (t.isToday || t.isOverdue) return true;
    if (!t.fechaVencimiento) return false;
    return t.fechaVencimiento >= now && t.fechaVencimiento <= weekEnd;
  }));
  var data = { mode: mode, generatedAt: now, pending: pending, today: today, overdue: overdue, critical: critical, weekly: weekly };
  if (mode === 'weekly') {
    data.subject = '📊 Resumen semanal de tareas - ' + Utilities.formatDate(now, TM_CONFIG.ZONA_HORARIA, 'dd/MM/yyyy');
    data.summaryLine = 'Pendientes: ' + pending.length + ' | Semana: ' + weekly.length + ' | Vencidas: ' + overdue.length + ' | Críticas: ' + critical.length;
    data.htmlBody = '<div style="font-family:Segoe UI,Arial,sans-serif;padding:18px;background:#f8f9fa;color:#202124;"><h2 style="color:#1a73e8;margin:0 0 10px 0;">📊 Resumen semanal de Task Manager</h2><p style="margin:0 0 12px 0;">Generado: <strong>' + _tmFormatDateTime_(now) + '</strong></p><div style="background:#e8f0fe;border-radius:10px;padding:12px;margin-bottom:16px;">' + data.summaryLine + '</div><h3 style="margin:18px 0 8px 0;">📆 Lo que cae esta semana</h3>' + _tmBuildTaskListHtml_(weekly, 'No hay tareas programadas para esta semana.') + '<h3 style="margin:18px 0 8px 0;">⚠️ Vencidas</h3>' + _tmBuildTaskListHtml_(overdue, 'No hay tareas vencidas.') + '<h3 style="margin:18px 0 8px 0;">🔴 Críticas</h3>' + _tmBuildTaskListHtml_(critical, 'No hay tareas críticas pendientes.') + '</div>';
    data.textBody = 'RESUMEN SEMANAL TASK MANAGER\nGenerado: ' + _tmFormatDateTime_(now) + '\n' + data.summaryLine + '\n\n[Semana]\n' + _tmBuildTaskListText_(weekly, 'No hay tareas programadas para esta semana.') + '\n\n[Vencidas]\n' + _tmBuildTaskListText_(overdue, 'No hay tareas vencidas.') + '\n\n[Críticas]\n' + _tmBuildTaskListText_(critical, 'No hay tareas críticas pendientes.');
    data.rowsToStamp = weekly.map(function(t) { return t.rowNumber; });
    return data;
  }
  data.subject = '📌 Resumen diario de tareas - ' + Utilities.formatDate(now, TM_CONFIG.ZONA_HORARIA, 'dd/MM/yyyy');
  data.summaryLine = 'Hoy: ' + today.length + ' | Vencidas: ' + overdue.length + ' | Críticas: ' + critical.length + ' | Pendientes totales: ' + pending.length;
  data.htmlBody = '<div style="font-family:Segoe UI,Arial,sans-serif;padding:18px;background:#f8f9fa;color:#202124;"><h2 style="color:#1a73e8;margin:0 0 10px 0;">📌 Resumen diario de Task Manager</h2><p style="margin:0 0 12px 0;">Generado: <strong>' + _tmFormatDateTime_(now) + '</strong></p><div style="background:#e8f0fe;border-radius:10px;padding:12px;margin-bottom:16px;">' + data.summaryLine + '</div><h3 style="margin:18px 0 8px 0;">📅 Para hoy</h3>' + _tmBuildTaskListHtml_(today, 'No hay tareas para hoy.') + '<h3 style="margin:18px 0 8px 0;">⚠️ Vencidas</h3>' + _tmBuildTaskListHtml_(overdue, 'No hay tareas vencidas.') + '<h3 style="margin:18px 0 8px 0;">🔴 Críticas</h3>' + _tmBuildTaskListHtml_(critical, 'No hay tareas críticas pendientes.') + '</div>';
  data.textBody = 'RESUMEN DIARIO TASK MANAGER\nGenerado: ' + _tmFormatDateTime_(now) + '\n' + data.summaryLine + '\n\n[Hoy]\n' + _tmBuildTaskListText_(today, 'No hay tareas para hoy.') + '\n\n[Vencidas]\n' + _tmBuildTaskListText_(overdue, 'No hay tareas vencidas.') + '\n\n[Críticas]\n' + _tmBuildTaskListText_(critical, 'No hay tareas críticas pendientes.');
  data.rowsToStamp = today.concat(overdue).concat(critical).map(function(t) { return t.rowNumber; }).filter(function(v, i, arr) { return arr.indexOf(v) === i; });
  return data;
}

function _tmStampNotification_(rowNumbers, label) {
  if (!rowNumbers || !rowNumbers.length) return;
  var sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(TM_CONFIG.NOMBRE_HOJA_TAREAS);
  if (!sh) return;
  var stamp = label + ' | ' + _tmFormatDateTime_(new Date());
  rowNumbers.forEach(function(row) { sh.getRange(row, 14).setValue(stamp); });
}

function _tmSendEmailSummary_(mode) {
  var to = obtenerEmailDestino();
  if (!to || to.indexOf('@') === -1) throw new Error('Correo destino inválido. Revisa Configuración > B3.');
  var payload = _tmGetSummaryPayload_(mode);
  MailApp.sendEmail({ to: to, subject: payload.subject, htmlBody: payload.htmlBody, body: payload.textBody, name: 'Task Manager' });
  _tmStampNotification_(payload.rowsToStamp, mode === 'weekly' ? 'Resumen semanal' : 'Resumen diario');
  registrarLog(to, payload.subject, 'ENVIADO');
  return payload;
}

function _tmSendWhatsAppSummary_() {
  var cfg = _tmGetWhatsAppConfig_();
  if (!cfg.idInstance || !cfg.apiToken || !cfg.chatId) throw new Error('Falta configurar WhatsApp en B6:B8 de la hoja Configuración.');
  var payload = _tmGetSummaryPayload_('daily');
  var url = 'https://api.green-api.com/waInstance' + encodeURIComponent(cfg.idInstance) + '/sendMessage/' + encodeURIComponent(cfg.apiToken);
  var body = { chatId: cfg.chatId, message: payload.textBody };
  var resp = UrlFetchApp.fetch(url, { method: 'post', contentType: 'application/json', payload: JSON.stringify(body), muteHttpExceptions: true });
  var code = resp.getResponseCode();
  var text = resp.getContentText();
  if (code < 200 || code >= 300) {
    registrarLog(cfg.chatId, payload.subject, 'ERROR WA ' + code);
    throw new Error('WhatsApp devolvió ' + code + ': ' + text);
  }
  _tmStampNotification_(payload.rowsToStamp, 'Resumen WhatsApp');
  registrarLog(cfg.chatId, payload.subject, 'ENVIADO WA');
  return payload;
}

function enviarResumenManual() {
  var payload = _tmSendEmailSummary_('daily');
  SpreadsheetApp.getUi().alert('✅ Resumen diario enviado.\n' + payload.summaryLine);
}

function enviarResumenSemanalManual() {
  var payload = _tmSendEmailSummary_('weekly');
  SpreadsheetApp.getUi().alert('✅ Resumen semanal enviado.\n' + payload.summaryLine);
}

function enviarWhatsAppManual() {
  var payload = _tmSendWhatsAppSummary_();
  SpreadsheetApp.getUi().alert('✅ Resumen enviado por WhatsApp.\n' + payload.summaryLine);
}

function _tmDeleteManagedTriggers_() {
  var handlers = {};
  [TM_TRIGGER_DAILY_HANDLER, TM_TRIGGER_WEEKLY_HANDLER, 'crearMenuTaskManager'].forEach(function(h) { handlers[h] = true; });
  var deleted = 0;
  ScriptApp.getProjectTriggers().forEach(function(t) {
    if (handlers[t.getHandlerFunction()]) {
      ScriptApp.deleteTrigger(t);
      deleted++;
    }
  });
  return deleted;
}

function configurarTriggerDiario() {
  var hour = _tmGetHoraEnvio_();
  _tmDeleteManagedTriggers_();
  ScriptApp.newTrigger(TM_TRIGGER_DAILY_HANDLER).timeBased().everyDays(1).atHour(hour).create();
  ScriptApp.newTrigger(TM_TRIGGER_WEEKLY_HANDLER).timeBased().onWeekDay(ScriptApp.WeekDay.MONDAY).atHour(TM_CONFIG.HORA_ENVIO_SEMANAL).create();
  SpreadsheetApp.getUi().alert('✅ Trigger diario activo.\nResumen diario: ' + hour + ':00\nResumen semanal: lunes ' + TM_CONFIG.HORA_ENVIO_SEMANAL + ':00');
}

function configurarTriggerSemanal() {
  ScriptApp.getProjectTriggers().forEach(function(t) { if (t.getHandlerFunction() === TM_TRIGGER_WEEKLY_HANDLER) ScriptApp.deleteTrigger(t); });
  ScriptApp.newTrigger(TM_TRIGGER_WEEKLY_HANDLER).timeBased().onWeekDay(ScriptApp.WeekDay.MONDAY).atHour(TM_CONFIG.HORA_ENVIO_SEMANAL).create();
  SpreadsheetApp.getUi().alert('✅ Trigger semanal activo.\nLunes a las ' + TM_CONFIG.HORA_ENVIO_SEMANAL + ':00');
}

function eliminarTriggers() {
  var deleted = _tmDeleteManagedTriggers_();
  SpreadsheetApp.getUi().alert('🚫 Triggers de Task Manager eliminados: ' + deleted);
}

function _tmTriggerResumenDiario() {
  try { _tmSendEmailSummary_('daily'); }
  catch (err) { registrarLog(obtenerEmailDestino(), 'Resumen diario automático', 'ERROR: ' + err); Logger.log('TM diario: ' + err); }
}

function _tmTriggerResumenSemanal() {
  try { _tmSendEmailSummary_('weekly'); }
  catch (err) { registrarLog(obtenerEmailDestino(), 'Resumen semanal automático', 'ERROR: ' + err); Logger.log('TM semanal: ' + err); }
}

function configurarWhatsApp() {
  var ui = SpreadsheetApp.getUi();
  var sh = _tmGetConfigSheet_();
  var current = _tmGetWhatsAppConfig_();
  var r1 = ui.prompt('📱 Configurar WhatsApp', 'ID Instance actual: ' + (current.idInstance || '(vacío)') + '\nIngresa el nuevo ID Instance:', ui.ButtonSet.OK_CANCEL);
  if (r1.getSelectedButton() !== ui.Button.OK) return;
  var idInstance = String(r1.getResponseText() || '').trim() || current.idInstance;
  var r2 = ui.prompt('📱 Configurar WhatsApp', 'API Token actual: ' + (current.apiToken ? '********' : '(vacío)') + '\nIngresa el nuevo API Token:', ui.ButtonSet.OK_CANCEL);
  if (r2.getSelectedButton() !== ui.Button.OK) return;
  var apiToken = String(r2.getResponseText() || '').trim() || current.apiToken;
  var r3 = ui.prompt('📱 Configurar WhatsApp', 'Chat ID actual: ' + (current.chatId || '(vacío)') + '\nIngresa el Chat ID (ej: 593900000000@c.us):', ui.ButtonSet.OK_CANCEL);
  if (r3.getSelectedButton() !== ui.Button.OK) return;
  var chatId = String(r3.getResponseText() || '').trim() || current.chatId;
  sh.getRange('B6').setValue(idInstance);
  sh.getRange('B7').setValue(apiToken);
  sh.getRange('B8').setValue(chatId);
  ui.alert('✅ Configuración de WhatsApp guardada.');
}

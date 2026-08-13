/*****************************************************************
 * 03_OBSERVACIONES_V3.gs — SIDEBAR ESTABLE + CONFIGURABLE
 * ────────────────────────────────────────────────────────────────
 * Generador de observaciones:
 * - Para la tarea
 * - Para la orden
 * - Integrado al menú principal 🧩 Sistema
 * - Sidebar robusto
 * - Regenerar relee la hoja sin cerrar el panel
 * - Autorizadores por departamento configurables
 * - Formato por orden con 1 ítem por línea
 *****************************************************************/

var OBS3_CFG = {
  SHEET_NAME: 'GENERAL',
  COL_CODIGO: 2,
  COL_DESC: 3,
  COL_CANT: 4,
  COL_PROV: 5,
  COL_PRECIO: 6,
  COL_OC: 7,
  COL_DEPTO: 10,
  COL_SOLIC: 11,
  COL_DETALLE: 12,
  TASK_ID_COL: 3,

  CONFIG_KEYS: {
    DEPT_MAP: 'OBS3_AUTH_DEPT_MAP',
    DEFAULT_AUTH: 'OBS3_AUTH_DEFAULT'
  },

  HEADERS: {
    OC: ['ORDEN DE COMPRA', 'ORDEN DE CO', 'OC', 'ORDEN'],
    PROV: ['PROVEEDOR'],
    DESC: ['DESCRIPCIÓN', 'DESCRIPCION'],
    CANT: ['CANTIDAD'],
    PRECIO: ['PRECIO UN', 'PRECIO UNIT', 'PRECIO UNITARIO', 'PRECIO'],
    DEPTO: ['DEPARTAMENTO'],
    SOLIC: ['SOLICITANTE'],
    DETALLE: ['DETALLE'],
    PEDIDO: ['PEDIDO', 'NUMERO DE PEDIDO', 'N° PEDIDO', 'NRO PEDIDO', '# PEDIDO']
  },

  DEFAULT_AUTORIZADORES: [
    'AUTORIZADOR DEMO 1',
    'AUTORIZADOR DEMO 2',
    'AUTORIZADOR DEMO 3'
  ],

  DEPT_AUTORIZADORES_DEFAULT: {
    'OBRA CIVIL': [
      'AUTORIZADOR DEMO 2',
      'AUTORIZADOR DEMO 3'
    ],
    'MERCADEO': [
      'AUTORIZADOR DEMO 4',
      'AUTORIZADOR DEMO 5',
      'AUTORIZADOR DEMO 3'
    ],
    'ELECTRICO': [
      'AUTORIZADOR DEMO 1',
      'AUTORIZADOR DEMO 2',
      'AUTORIZADOR DEMO 3'
    ],
    'REDES LAN': [
      'AUTORIZADOR DEMO 2',
      'AUTORIZADOR DEMO 3'
    ],
    'SLA': [
      'AUTORIZADOR DEMO 6',
      'AUTORIZADOR DEMO 2',
      'AUTORIZADOR DEMO 3'
    ]
  }
};

// ════════════════════════════════════════════════════════════════
// INTEGRACIÓN CON EL MENÚ PRINCIPAL
// ════════════════════════════════════════════════════════════════

function OBS3_addToSistemaMenu_(menu, ui) {
  ui = ui || SpreadsheetApp.getUi();

  menu.addSubMenu(
    ui.createMenu('📝 Emitir observaciones')
      .addItem('Abrir panel lateral', 'obs3_abrirSidebar')
      .addItem('Autorizadores por departamento', 'obs3_abrirConfigSidebar')
      .addItem('Restaurar configuración por defecto', 'obs3_restaurarConfigPorDefectoConfirm')
  );

  return menu;
}

function obs3_abrirSidebar() {
  var html = HtmlService.createHtmlOutput(_obs3_getSidebarHTML())
    .setTitle('Emitir observaciones');
  SpreadsheetApp.getUi().showSidebar(html);
}

function obs3_abrirConfigSidebar() {
  var html = HtmlService.createHtmlOutput(_obs3_getConfigSidebarHTML())
    .setTitle('Autorizadores');
  SpreadsheetApp.getUi().showSidebar(html);
}

function obs3_restaurarConfigPorDefectoConfirm() {
  var ui = SpreadsheetApp.getUi();
  var resp = ui.alert(
    'Restaurar configuración',
    'Se restaurarán los autorizadores por departamento a los valores por defecto. ¿Continuar?',
    ui.ButtonSet.YES_NO
  );

  if (resp === ui.Button.YES) {
    obs3_restaurarConfigAutorizadores();
    ui.alert('Listo', 'Se restauró la configuración por defecto.', ui.ButtonSet.OK);
  }
}

// ════════════════════════════════════════════════════════════════
// BACKEND PRINCIPAL
// ════════════════════════════════════════════════════════════════

function obs3_generarParaLaTarea(taskId) {
  taskId = normalizeTaskId_(taskId);
  if (!taskId) return { error: 'Número de tarea inválido.' };

  var records = _obs3_getRecords();
  var inTask = records.filter(function(r) {
    return r.taskId === taskId && !isBlank_(r.oc);
  });

  if (!inTask.length) {
    return { error: 'No encontré OC para la tarea ' + taskId + '.' };
  }

  var depto = _obs3_getTaskDepto_(records, taskId);
  var autorizadores = _obs3_getAutorizadoresByDept_(depto);

  var map = {};
  inTask.forEach(function(r) {
    var oc = String(r.oc).trim();
    if (!map[oc]) map[oc] = {};
    var prov = !isBlank_(r.prov) ? String(r.prov).trim() : 'PROVEEDOR N/D';
    map[oc][prov] = true;
  });

  var ocs = Object.keys(map).sort();
  var lines = ocs.map(function(oc) {
    var proveedores = Object.keys(map[oc]).sort().join(' / ');
    return 'SE GENERA OC ' + oc + ' ' + proveedores + ' POR AUTORIZAR, ' + autorizadores;
  });

  return {
    lines: lines,
    count: lines.length
  };
}

function obs3_generarParaLaOrden(taskId) {
  taskId = normalizeTaskId_(taskId);
  if (!taskId) return { error: 'Número de tarea inválido.' };

  var records = _obs3_getRecords();
  var inTask = records.filter(function(r) {
    return r.taskId === taskId;
  });

  if (!inTask.length) {
    return { error: 'No encontré ítems para la tarea ' + taskId + '.' };
  }

  var base = inTask[0];
  var pedido = base.pedido ? String(base.pedido).trim() : 'N/D';
  var depto = base.depto ? String(base.depto).trim() : 'N/D';
  var detalle = base.detalle ? String(base.detalle).trim() : 'N/D';
  var solicit = base.solic ? String(base.solic).trim() : 'N/D';

  var detalleCabecera = _obs3_ensureTrailingDot_(depto + ':' + detalle);

  var byProv = {};
  inTask.forEach(function(r) {
    var prov = (r.prov && String(r.prov).trim()) ? String(r.prov).trim() : 'PROVEEDOR N/D';
    if (!byProv[prov]) byProv[prov] = [];
    byProv[prov].push(r);
  });

  var proveedores = Object.keys(byProv).sort();

  var lines = proveedores.map(function(prov) {
    var itemStr = byProv[prov].map(function(r) {
      return _obs3_buildProveedorItemLine_(r, prov);
    }).join('\n');

    return 'TAREA #' + taskId +
      '//PEDIDO:' + pedido +
      '//' + detalleCabecera +
      '// SOLIC. ' + solicit +
      ' // REFER. COTIZ. ' + prov +
      '   DETALLE:\n\n' + itemStr;
  });

  return {
    lines: lines,
    count: lines.length
  };
}

function obs3_listarTareas() {
  var records = _obs3_getRecords();
  var taskMap = {};

  records.forEach(function(r) {
    if (!r.taskId) return;

    if (!taskMap[r.taskId]) {
      taskMap[r.taskId] = {
        id: r.taskId,
        depto: r.depto || '',
        detalle: r.detalle || '',
        itemCount: 0,
        ocCount: 0
      };
    }

    taskMap[r.taskId].itemCount++;
    if (!isBlank_(r.oc)) taskMap[r.taskId].ocCount++;
  });

  return Object.keys(taskMap)
    .sort(function(a, b) { return a < b ? -1 : a > b ? 1 : 0; })
    .map(function(k) { return taskMap[k]; });
}

// ════════════════════════════════════════════════════════════════
// CONFIGURACIÓN
// ════════════════════════════════════════════════════════════════

function obs3_obtenerConfigAutorizadores() {
  var cfg = _obs3_getRuntimeConfig_();
  return {
    deptMap: cfg.deptMap,
    defaultAutorizadores: cfg.defaultAutorizadores
  };
}

function obs3_guardarConfigAutorizadores(payload) {
  payload = payload || {};

  var deptMap = {};
  var rows = Array.isArray(payload.rows) ? payload.rows : [];

  rows.forEach(function(row) {
    if (!row) return;

    var depto = normalizeText_(row.depto);
    var autores = _obs3_sanitizeStringArray_(row.autorizadores);

    if (!depto) return;
    if (!autores.length) return;

    deptMap[depto] = autores;
  });

  var defaultAut = _obs3_sanitizeStringArray_(payload.defaultAutorizadores);
  if (!defaultAut.length) {
    defaultAut = _obs3_clone_(OBS3_CFG.DEFAULT_AUTORIZADORES);
  }

  var props = PropertiesService.getDocumentProperties();
  props.setProperty(OBS3_CFG.CONFIG_KEYS.DEPT_MAP, JSON.stringify(deptMap));
  props.setProperty(OBS3_CFG.CONFIG_KEYS.DEFAULT_AUTH, JSON.stringify(defaultAut));

  return { ok: true, message: 'Configuración guardada.' };
}

function obs3_restaurarConfigAutorizadores() {
  var props = PropertiesService.getDocumentProperties();
  props.deleteProperty(OBS3_CFG.CONFIG_KEYS.DEPT_MAP);
  props.deleteProperty(OBS3_CFG.CONFIG_KEYS.DEFAULT_AUTH);
  return { ok: true };
}

// ════════════════════════════════════════════════════════════════
// LECTURA DE DATOS
// ════════════════════════════════════════════════════════════════

function _obs3_getRecords() {
  var sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(OBS3_CFG.SHEET_NAME);
  if (!sh) throw new Error('No existe hoja "' + OBS3_CFG.SHEET_NAME + '".');

  var lastRow = sh.getLastRow();
  var lastCol = sh.getLastColumn();
  if (lastRow < 2) return [];

  var allData = sh.getRange(1, 1, lastRow, lastCol).getValues();
  var cols = _obs3_resolveCols(allData[0]);

  var currentTask = {
    taskId: '',
    depto: '',
    solic: '',
    detalle: '',
    pedido: ''
  };

  var out = [];

  for (var i = 1; i < allData.length; i++) {
    var row = allData[i];

    var tid = normalizeTaskId_(row[cols.taskId - 1]);
    var code = row[OBS3_CFG.COL_CODIGO - 1];
    var qty = row[cols.cant - 1];
    var prov = row[cols.prov - 1];

    var isTaskHeader = GENERAL_isTaskHeaderRow_(
      row,
      cols.taskId,
      OBS3_CFG.COL_CODIGO,
      cols.cant,
      cols.prov
    );

    if (tid && isTaskHeader) {
      currentTask = {
        taskId: tid,
        depto: normalizeText_(row[cols.depto - 1]),
        solic: normalizeText_(row[cols.solic - 1]),
        detalle: normalizeText_(row[cols.detalle - 1]),
        pedido: cols.pedido ? normalizeText_(row[cols.pedido - 1]) : ''
      };
      continue;
    }

    if (!currentTask.taskId) continue;

    var desc = row[cols.desc - 1];
    var oc = row[cols.oc - 1];

    if (
      isBlank_(code) &&
      isBlank_(desc) &&
      isBlank_(qty) &&
      isBlank_(prov) &&
      isBlank_(oc)
    ) {
      continue;
    }

    out.push({
      taskId: currentTask.taskId,
      pedido: (cols.pedido && !isBlank_(row[cols.pedido - 1])) ? normalizeText_(row[cols.pedido - 1]) : currentTask.pedido,
      depto: !isBlank_(row[cols.depto - 1]) ? normalizeText_(row[cols.depto - 1]) : currentTask.depto,
      solic: !isBlank_(row[cols.solic - 1]) ? normalizeText_(row[cols.solic - 1]) : currentTask.solic,
      detalle: !isBlank_(row[cols.detalle - 1]) ? normalizeText_(row[cols.detalle - 1]) : currentTask.detalle,
      desc: normalizeText_(desc),
      cant: qty,
      prov: normalizeText_(prov),
      precio: row[cols.precio - 1],
      oc: normalizeText_(oc)
    });
  }

  return out;
}

function _obs3_resolveCols(header) {
  var map = {};
  header.forEach(function(h, i) {
    map[String(h || '').trim().toUpperCase()] = i + 1;
  });

  function pick(keys, fallback) {
    for (var i = 0; i < keys.length; i++) {
      var c = map[String(keys[i]).trim().toUpperCase()];
      if (c) return c;
    }
    return fallback;
  }

  return {
    desc: pick(OBS3_CFG.HEADERS.DESC, OBS3_CFG.COL_DESC),
    cant: pick(OBS3_CFG.HEADERS.CANT, OBS3_CFG.COL_CANT),
    prov: pick(OBS3_CFG.HEADERS.PROV, OBS3_CFG.COL_PROV),
    precio: pick(OBS3_CFG.HEADERS.PRECIO, OBS3_CFG.COL_PRECIO),
    oc: pick(OBS3_CFG.HEADERS.OC, OBS3_CFG.COL_OC),
    depto: pick(OBS3_CFG.HEADERS.DEPTO, OBS3_CFG.COL_DEPTO),
    solic: pick(OBS3_CFG.HEADERS.SOLIC, OBS3_CFG.COL_SOLIC),
    detalle: pick(OBS3_CFG.HEADERS.DETALLE, OBS3_CFG.COL_DETALLE),
    pedido: pick(OBS3_CFG.HEADERS.PEDIDO, 0),
    taskId: OBS3_CFG.TASK_ID_COL
  };
}

// ════════════════════════════════════════════════════════════════
// HELPERS
// ════════════════════════════════════════════════════════════════

function _obs3_clone_(obj) {
  return JSON.parse(JSON.stringify(obj));
}

function _obs3_normKey_(v) {
  var s = normalizeText_(v);
  if (!s) return '';
  return s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toUpperCase();
}

function _obs3_sanitizeStringArray_(arr) {
  arr = Array.isArray(arr) ? arr : [];
  var out = [];
  var seen = {};

  arr.forEach(function(v) {
    var txt = normalizeText_(v);
    if (!txt) return;

    var key = _obs3_normKey_(txt);
    if (seen[key]) return;

    seen[key] = true;
    out.push(txt);
  });

  return out;
}

function _obs3_getRuntimeConfig_() {
  var props = PropertiesService.getDocumentProperties();

  var deptMap = _obs3_clone_(OBS3_CFG.DEPT_AUTORIZADORES_DEFAULT);
  var defaultAutorizadores = _obs3_clone_(OBS3_CFG.DEFAULT_AUTORIZADORES);

  try {
    var rawMap = props.getProperty(OBS3_CFG.CONFIG_KEYS.DEPT_MAP);
    if (rawMap) {
      var parsedMap = JSON.parse(rawMap);
      if (parsedMap && typeof parsedMap === 'object') {
        deptMap = {};
        Object.keys(parsedMap).forEach(function(k) {
          var depto = normalizeText_(k);
          var autores = _obs3_sanitizeStringArray_(parsedMap[k]);
          if (depto && autores.length) {
            deptMap[depto] = autores;
          }
        });
      }
    }
  } catch (err) {}

  try {
    var rawDefault = props.getProperty(OBS3_CFG.CONFIG_KEYS.DEFAULT_AUTH);
    if (rawDefault) {
      var parsedDefault = JSON.parse(rawDefault);
      var sanitized = _obs3_sanitizeStringArray_(parsedDefault);
      if (sanitized.length) {
        defaultAutorizadores = sanitized;
      }
    }
  } catch (err2) {}

  return {
    deptMap: deptMap,
    defaultAutorizadores: defaultAutorizadores
  };
}

function _obs3_getAutorizadoresByDept_(depto) {
  var cfg = _obs3_getRuntimeConfig_();
  var wanted = _obs3_normKey_(depto);

  var keys = Object.keys(cfg.deptMap);
  for (var i = 0; i < keys.length; i++) {
    if (_obs3_normKey_(keys[i]) === wanted) {
      return cfg.deptMap[keys[i]].join(', ');
    }
  }

  return cfg.defaultAutorizadores.join(', ');
}

function _obs3_getTaskDepto_(records, taskId) {
  var rows = records.filter(function(r) {
    return r.taskId === taskId;
  });

  if (!rows.length) return '';

  for (var i = 0; i < rows.length; i++) {
    if (!isBlank_(rows[i].depto)) return String(rows[i].depto).trim();
  }

  return '';
}

function _obs3_formatMoney_(v) {
  if (isBlank_(v)) return '$0.00';

  if (typeof v === 'number') {
    return '$' + v.toFixed(2);
  }

  var raw = String(v).trim();
  var cleaned = raw.replace(/[^\d,.\-]/g, '');

  if (cleaned.indexOf(',') > -1 && cleaned.indexOf('.') === -1) {
    cleaned = cleaned.replace(',', '.');
  }

  var num = Number(cleaned);
  if (isNaN(num)) return raw;

  return '$' + num.toFixed(2);
}

function _obs3_ensureTrailingDot_(text) {
  var s = normalizeText_(text);
  if (!s) return '';
  return /[.:;!?]$/.test(s) ? s : s + '.';
}

function _obs3_cleanInlineValue_(v) {
  if (isBlank_(v)) return 'N/D';
  return String(v).replace(/\s+/g, ' ').trim();
}

function _obs3_buildProveedorItemLine_(r, prov) {
  var desc = _obs3_cleanInlineValue_(r.desc);
  var cant = _obs3_cleanInlineValue_(r.cant);
  var proveedor = _obs3_cleanInlineValue_(prov);
  var precio = _obs3_formatMoney_(r.precio);

  return desc + ' ' + cant + ' ' + proveedor + ' ' + precio;
}

// ════════════════════════════════════════════════════════════════
// HTML SIDEBAR PRINCIPAL
// ════════════════════════════════════════════════════════════════

function _obs3_getSidebarHTML() {
  return `
<!DOCTYPE html>
<html>
<head>
  <base target="_top">
  <meta charset="utf-8">
  <style>
    * { box-sizing: border-box; }
    body {
      font-family: "Segoe UI", Arial, sans-serif;
      padding: 12px;
      background: #f8f9fa;
      font-size: 13px;
      margin: 0;
    }
    h2 {
      color: #1a73e8;
      font-size: 15px;
      margin: 0 0 10px 0;
    }
    label {
      display: block;
      font-weight: 600;
      margin-bottom: 4px;
      color: #333;
      font-size: 12px;
    }
    input[type="text"] {
      width: 100%;
      padding: 8px 10px;
      border: 1px solid #dadce0;
      border-radius: 6px;
      font-size: 13px;
    }
    input[type="text"]:focus {
      border-color: #1a73e8;
      outline: none;
      box-shadow: 0 0 0 2px rgba(26,115,232,0.15);
    }
    .btn-row {
      display: flex;
      gap: 6px;
      margin-top: 8px;
    }
    .btn {
      flex: 1;
      padding: 9px 6px;
      border: none;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 700;
      cursor: pointer;
      text-align: center;
    }
    .btn-oc { background: #1a73e8; color: #fff; }
    .btn-prov { background: #e65100; color: #fff; }
    .btn-refresh {
      background: #2e7d32;
      color: #fff;
      width: 100%;
      margin-top: 6px;
      display: none;
    }
    .btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    .status {
      margin-top: 8px;
      padding: 8px;
      border-radius: 6px;
      font-size: 12px;
      text-align: center;
      display: none;
    }
    .results-header {
      font-weight: 700;
      color: #333;
      font-size: 13px;
      padding-bottom: 6px;
      border-bottom: 2px solid #1a73e8;
      margin: 12px 0 8px;
    }
    .card {
      border: 1px solid #ddd;
      border-radius: 8px;
      padding: 8px;
      margin-bottom: 8px;
      background: #fff;
    }
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 6px;
      gap: 8px;
    }
    .card-num {
      background: #1a73e8;
      color: #fff;
      width: 22px;
      height: 22px;
      border-radius: 50%;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-size: 11px;
      font-weight: 700;
    }
    .btn-copy {
      padding: 4px 10px;
      border: none;
      border-radius: 4px;
      background: #1a73e8;
      color: #fff;
      font-size: 11px;
      font-weight: 700;
      cursor: pointer;
    }
    .btn-copy.copied {
      background: #2e7d32;
    }
    .ta {
      width: 100%;
      min-height: 90px;
      max-height: 220px;
      resize: vertical;
      font-size: 11px;
      padding: 6px;
      border: 1px solid #e0e0e0;
      border-radius: 4px;
      line-height: 1.45;
      white-space: pre-wrap;
    }
    .sug {
      max-height: 120px;
      overflow-y: auto;
      border: 1px solid #dadce0;
      border-radius: 6px;
      background: #fff;
      display: none;
      margin-top: 2px;
    }
    .sug-item {
      padding: 6px 8px;
      cursor: pointer;
      font-size: 12px;
      border-bottom: 1px solid #f0f0f0;
    }
    .sug-item:hover {
      background: #e8f0fe;
    }
    .sug-item small {
      color: #888;
    }
    .tip {
      background: #e3f2fd;
      border-radius: 6px;
      padding: 8px;
      font-size: 11px;
      color: #1565c0;
      margin-top: 8px;
      line-height: 1.5;
    }
  </style>
</head>
<body>
  <h2>📋 Emitir observaciones</h2>

  <div style="margin-bottom:14px">
    <label>🔢 Número de Tarea</label>
    <input type="text" id="taskInput" placeholder="Ej: 1234567">
    <div class="sug" id="sug"></div>
  </div>

  <div class="btn-row">
    <button class="btn btn-oc" id="bOC" disabled>📋 Para la tarea</button>
    <button class="btn btn-prov" id="bProv" disabled>🏢 Para la orden</button>
  </div>

  <button class="btn btn-refresh" id="bRef">🔄 REGENERAR (relee la hoja)</button>

  <div class="status" id="st"></div>
  <div id="res"></div>

  <div class="tip" id="tip">
    <strong>Flujo rápido:</strong><br>
    1. Ingresa la tarea<br>
    2. Genera el texto<br>
    3. Copia la observación<br>
    4. Actualiza la hoja<br>
    5. Regenera sin cerrar el panel
  </div>

  <script>
    var _mode = '';
    var _task = '';
    var _allTasks = [];

    var taskInput = document.getElementById('taskInput');
    var sug = document.getElementById('sug');
    var bOC = document.getElementById('bOC');
    var bProv = document.getElementById('bProv');
    var bRef = document.getElementById('bRef');
    var st = document.getElementById('st');
    var res = document.getElementById('res');
    var tip = document.getElementById('tip');

    function onlyDigits(v) {
      return String(v || '').replace(/\\D/g, '');
    }

    function isValidTask(v) {
      return /^\\d{6,}$/.test(String(v || '').trim());
    }

    function escHtml(v) {
      return String(v || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    }

    function setStatus(msg, bg) {
      st.textContent = msg;
      st.style.background = bg || '#e3f2fd';
      st.style.display = 'block';
    }

    function hideStatus() {
      st.style.display = 'none';
    }

    function updateButtons() {
      var v = onlyDigits(taskInput.value);
      if (taskInput.value !== v) taskInput.value = v;
      var ok = isValidTask(v);
      bOC.disabled = !ok;
      bProv.disabled = !ok;
    }

    function filterSuggestions() {
      var q = onlyDigits(taskInput.value);
      if (!_allTasks.length || q.length < 3) {
        sug.style.display = 'none';
        sug.innerHTML = '';
        return;
      }

      var found = _allTasks.filter(function(t) {
        return String(t.id).indexOf(q) !== -1;
      }).slice(0, 8);

      if (!found.length) {
        sug.style.display = 'none';
        sug.innerHTML = '';
        return;
      }

      sug.innerHTML = found.map(function(t) {
        return (
          '<div class="sug-item" data-id="' + escHtml(t.id) + '">' +
            '<strong>' + escHtml(t.id) + '</strong> ' +
            '<small>' + escHtml(t.depto || '') + ' — ' +
            escHtml((t.detalle || '').substring(0, 30)) +
            ' (' + escHtml(t.itemCount) + ' ítems, ' + escHtml(t.ocCount) + ' OC)</small>' +
          '</div>'
        );
      }).join('');
      sug.style.display = 'block';
    }

    function selectTask(id) {
      taskInput.value = onlyDigits(id);
      sug.style.display = 'none';
      updateButtons();
    }

    function setBusy(flag) {
      bOC.disabled = flag || !isValidTask(taskInput.value);
      bProv.disabled = flag || !isValidTask(taskInput.value);
    }

    function renderResult(modeLabel, taskId, lines) {
      var html = '<div class="results-header">' + escHtml(modeLabel) + ' — Tarea ' + escHtml(taskId) + ' (' + lines.length + ')</div>';

      lines.forEach(function(txt, i) {
        html += ''
          + '<div class="card">'
          +   '<div class="card-header">'
          +     '<div style="display:flex;align-items:center;gap:6px">'
          +       '<div class="card-num">' + (i + 1) + '</div>'
          +       '<span style="font-weight:700;font-size:12px">Obs ' + (i + 1) + '</span>'
          +     '</div>'
          +     '<button class="btn-copy" id="cb' + i + '" onclick="copyText(' + i + ')">Copiar</button>'
          +   '</div>'
          +   '<textarea class="ta" id="ta' + i + '">' + escHtml(txt) + '</textarea>'
          + '</div>';
      });

      res.innerHTML = html;
    }

    function runGenerate(mode) {
      var tid = onlyDigits(taskInput.value);
      if (!isValidTask(tid)) {
        setStatus('Número de tarea inválido.', '#fff3e0');
        return;
      }

      _mode = mode;
      _task = tid;

      setBusy(true);
      setStatus('Generando...', '#e3f2fd');

      var okHandler = function(data) {
        setBusy(false);

        if (!data || data.error) {
          setStatus(data && data.error ? data.error : 'No se pudo generar.', '#fff3e0');
          res.innerHTML = '';
          return;
        }

        hideStatus();
        bRef.style.display = 'block';
        tip.style.display = 'none';

        renderResult(mode === 'tarea' ? 'Para la tarea' : 'Para la orden', tid, data.lines || []);
      };

      var errHandler = function(err) {
        setBusy(false);
        setStatus((err && err.message) ? err.message : String(err), '#ffebee');
      };

      if (mode === 'tarea') {
        google.script.run
          .withSuccessHandler(okHandler)
          .withFailureHandler(errHandler)
          .obs3_generarParaLaTarea(tid);
      } else {
        google.script.run
          .withSuccessHandler(okHandler)
          .withFailureHandler(errHandler)
          .obs3_generarParaLaOrden(tid);
      }
    }

    function copyText(i) {
      var ta = document.getElementById('ta' + i);
      var btn = document.getElementById('cb' + i);
      if (!ta || !btn) return;

      ta.focus();
      ta.select();
      ta.setSelectionRange(0, ta.value.length);

      try {
        document.execCommand('copy');
        btn.textContent = '✅ Copiado';
        btn.classList.add('copied');
        setTimeout(function() {
          btn.textContent = 'Copiar';
          btn.classList.remove('copied');
        }, 1500);
      } catch (e) {
        btn.textContent = 'Error';
      }
    }

    function reloadCurrent() {
      if (_mode && _task) {
        taskInput.value = _task;
        updateButtons();
        runGenerate(_mode);
      }
    }

    taskInput.addEventListener('input', function() {
      updateButtons();
      filterSuggestions();
    });

    taskInput.addEventListener('focus', function() {
      filterSuggestions();
    });

    bOC.addEventListener('click', function() {
      runGenerate('tarea');
    });

    bProv.addEventListener('click', function() {
      runGenerate('orden');
    });

    bRef.addEventListener('click', function() {
      reloadCurrent();
    });

    sug.addEventListener('click', function(e) {
      var item = e.target.closest('.sug-item');
      if (!item) return;
      selectTask(item.getAttribute('data-id'));
    });

    document.addEventListener('click', function(e) {
      if (!e.target.closest('#taskInput') && !e.target.closest('#sug')) {
        sug.style.display = 'none';
      }
    });

    google.script.run
      .withSuccessHandler(function(tasks) {
        _allTasks = tasks || [];
      })
      .withFailureHandler(function() {
        _allTasks = [];
      })
      .obs3_listarTareas();

    updateButtons();
  </script>
</body>
</html>
`;
}

// ════════════════════════════════════════════════════════════════
// HTML SIDEBAR CONFIGURACIÓN
// ════════════════════════════════════════════════════════════════

function _obs3_getConfigSidebarHTML() {
  return `
<!DOCTYPE html>
<html>
<head>
  <base target="_top">
  <meta charset="utf-8">
  <style>
    * { box-sizing: border-box; }
    body {
      font-family: "Segoe UI", Arial, sans-serif;
      background: #f8f9fa;
      margin: 0;
      padding: 12px;
      font-size: 13px;
    }
    h2 {
      margin: 0 0 10px;
      font-size: 15px;
      color: #1a73e8;
    }
    .box {
      background: #fff;
      border: 1px solid #ddd;
      border-radius: 8px;
      padding: 10px;
      margin-bottom: 10px;
    }
    .row {
      margin-bottom: 8px;
    }
    label {
      display: block;
      font-weight: 700;
      margin-bottom: 4px;
      color: #333;
      font-size: 12px;
    }
    input[type="text"], textarea {
      width: 100%;
      border: 1px solid #dadce0;
      border-radius: 6px;
      padding: 8px;
      font-size: 12px;
      font-family: inherit;
    }
    textarea {
      min-height: 86px;
      resize: vertical;
      line-height: 1.4;
    }
    .btn {
      border: none;
      border-radius: 6px;
      padding: 9px 10px;
      font-weight: 700;
      cursor: pointer;
      font-size: 12px;
    }
    .btn-save { background: #1a73e8; color: #fff; }
    .btn-add { background: #2e7d32; color: #fff; }
    .btn-del { background: #d32f2f; color: #fff; }
    .btn-reset { background: #6d4c41; color: #fff; }
    .btn-row {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
      margin-top: 8px;
    }
    .cfg-row {
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      padding: 10px;
      margin-bottom: 10px;
      background: #fff;
    }
    .status {
      display: none;
      border-radius: 6px;
      padding: 8px;
      margin-bottom: 10px;
      font-size: 12px;
    }
    .hint {
      background: #e3f2fd;
      color: #1565c0;
      border-radius: 6px;
      padding: 8px;
      font-size: 11px;
      line-height: 1.45;
      margin-bottom: 10px;
    }
  </style>
</head>
<body>
  <h2>⚙️ Autorizadores por departamento</h2>

  <div class="status" id="st"></div>

  <div class="hint">
    Escribe un autorizador por línea.<br>
    Puedes agregar o eliminar departamentos desde aquí.
  </div>

  <div class="box">
    <div class="row">
      <label>Autorizadores por defecto</label>
      <textarea id="defaultAuth" placeholder="Uno por línea"></textarea>
    </div>
  </div>

  <div id="rows"></div>

  <div class="btn-row">
    <button class="btn btn-add" onclick="addRow()">+ Agregar departamento</button>
    <button class="btn btn-save" onclick="saveConfig()">💾 Guardar</button>
    <button class="btn btn-reset" onclick="resetConfig()">↺ Restaurar por defecto</button>
  </div>

  <script>
    var rowsEl = document.getElementById('rows');
    var st = document.getElementById('st');
    var defaultAuth = document.getElementById('defaultAuth');

    function escHtml(v) {
      return String(v || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    }

    function setStatus(msg, bg) {
      st.textContent = msg;
      st.style.background = bg || '#e3f2fd';
      st.style.display = 'block';
    }

    function makeRow(depto, autores) {
      var wrap = document.createElement('div');
      wrap.className = 'cfg-row';
      wrap.innerHTML =
        '<div class="row">' +
          '<label>Departamento</label>' +
          '<input type="text" class="depto" value="' + escHtml(depto || '') + '" placeholder="Ej: OBRA CIVIL">' +
        '</div>' +
        '<div class="row">' +
          '<label>Autorizadores</label>' +
          '<textarea class="autores" placeholder="Uno por línea">' + escHtml((autores || []).join('\\n')) + '</textarea>' +
        '</div>' +
        '<button class="btn btn-del" onclick="removeRow(this)">Eliminar</button>';
      rowsEl.appendChild(wrap);
    }

    function addRow() {
      makeRow('', []);
    }

    function removeRow(btn) {
      var row = btn.closest('.cfg-row');
      if (row) row.remove();
    }

    function collectPayload() {
      var rows = [];
      document.querySelectorAll('.cfg-row').forEach(function(el) {
        var depto = (el.querySelector('.depto').value || '').trim();
        var autores = (el.querySelector('.autores').value || '')
          .split(/\\n+/)
          .map(function(x) { return x.trim(); })
          .filter(function(x) { return !!x; });

        rows.push({
          depto: depto,
          autorizadores: autores
        });
      });

      var defaultAutorizadores = (defaultAuth.value || '')
        .split(/\\n+/)
        .map(function(x) { return x.trim(); })
        .filter(function(x) { return !!x; });

      return {
        rows: rows,
        defaultAutorizadores: defaultAutorizadores
      };
    }

    function saveConfig() {
      var payload = collectPayload();

      google.script.run
        .withSuccessHandler(function(resp) {
          setStatus((resp && resp.message) ? resp.message : 'Configuración guardada.', '#e8f5e9');
        })
        .withFailureHandler(function(err) {
          setStatus((err && err.message) ? err.message : String(err), '#ffebee');
        })
        .obs3_guardarConfigAutorizadores(payload);
    }

    function resetConfig() {
      var ok = confirm('Se restaurará la configuración por defecto. ¿Continuar?');
      if (!ok) return;

      google.script.run
        .withSuccessHandler(function() {
          loadData();
          setStatus('Configuración restaurada.', '#e8f5e9');
        })
        .withFailureHandler(function(err) {
          setStatus((err && err.message) ? err.message : String(err), '#ffebee');
        })
        .obs3_restaurarConfigAutorizadores();
    }

    function loadData() {
      google.script.run
        .withSuccessHandler(function(data) {
          rowsEl.innerHTML = '';
          defaultAuth.value = (data.defaultAutorizadores || []).join('\\n');

          var keys = Object.keys(data.deptMap || {});
          if (!keys.length) {
            addRow();
            return;
          }

          keys.forEach(function(k) {
            makeRow(k, data.deptMap[k] || []);
          });
        })
        .withFailureHandler(function(err) {
          setStatus((err && err.message) ? err.message : String(err), '#ffebee');
        })
        .obs3_obtenerConfigAutorizadores();
    }

    loadData();
  </script>
</body>
</html>
`;
}
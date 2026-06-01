/*****************************************************************
 * 00_APP_CONFIG.example.gs
 * Configuración base del sistema.
 * Copiar como 00_APP_CONFIG.gs en el entorno real.
 *****************************************************************/

function SYS_getTz_() {
  try {
    return SpreadsheetApp.getActiveSpreadsheet().getSpreadsheetTimeZone() ||
      Session.getScriptTimeZone() ||
      'America/Guayaquil';
  } catch (e) {
    return Session.getScriptTimeZone() || 'America/Guayaquil';
  }
}

var SYS_CFG = {
  TZ: SYS_getTz_(),
  SHEETS: {
    TAREAS: 'TAREAS',
    GENERAL: 'GENERAL',
    FAC: 'FAC POR COMPARTIR',
    CONFIG: 'Configuración',
    COMPLETADAS: 'Completadas',
    DASHBOARD: 'Dashboard',
    LOG_CORREOS: 'Log Correos',
    JT_EXPORT: 'JT_EXPORT',
    WA_CFG: 'WA_AUTO_CFG',
    WA_CONTACTOS: 'WA_AUTO_CONTACTOS',
    WA_PROGRAMACION: 'WA_AUTO_PROGRAMACION',
    WA_PLANTILLAS: 'WA_AUTO_PLANTILLAS',
    WA_LOG: 'WA_AUTO_LOG'
  }
};

function SYS_sh_(name) {
  var sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(name);
  if (!sh) throw new Error('No existe la hoja: ' + name);
  return sh;
}
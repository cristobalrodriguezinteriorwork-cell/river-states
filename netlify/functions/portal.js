// ───────────────────────────────────────────────────────────────
//  PORTAL RIVER STATES — capa segura (serverless)
//  El TOKEN de Monday vive AQUÍ (variable de entorno), nunca en el navegador.
//  El cliente entra con un código; el admin con otro.
//  Variables de entorno a configurar en Netlify:
//    MONDAY_TOKEN        → tu token de Monday
//    PORTAL_CLIENT_CODE  → código que le das al cliente/desarrollador
//    PORTAL_ADMIN_CODE   → código para ustedes (Wood Studio)
// ───────────────────────────────────────────────────────────────

const BOARD_ID = 10019027783;                 // River States
const MONDAY   = 'https://api.monday.com/v2';

// IDs de columnas del tablero River States
const COL = {
  fabricacion: 'color_mm4v739t',    // Fabricación Cocina
  cocina:      'status',            // Instalación Cocina
  tope:        'color_mkvn9ykp',    // Instalación Tope
  inspContrat: 'color_mkvnz58a',    // Insp. Contratista
  inspCliente: 'color_mkvnec2y',    // Insp. Cliente
  garantias:   'long_text_mm4xrxs8',// Garantías (lista JSON)
};

async function mondayGQL(query, variables) {
  const res = await fetch(MONDAY, {
    method: 'POST',
    headers: {
      'Authorization': process.env.MONDAY_TOKEN,
      'Content-Type': 'application/json',
      'API-Version': '2024-01',
    },
    body: JSON.stringify({ query, variables: variables || {} }),
  });
  const json = await res.json();
  if (json.errors) throw new Error(json.errors[0].message || 'Error Monday');
  return json.data;
}

function roleOf(code) {
  if (code && code === process.env.PORTAL_ADMIN_CODE)  return 'admin';
  if (code && code === process.env.PORTAL_CLIENT_CODE) return 'client';
  return null;
}

const colText = (item, id) => {
  const cv = (item.column_values || []).find(c => c.id === id);
  return cv ? (cv.text || '') : '';
};

function parseGarantias(txt) {
  if (!txt || !txt.trim()) return [];
  try { const a = JSON.parse(txt); return Array.isArray(a) ? a : []; } catch (e) { return []; }
}

async function saveGarantias(unitId, arr) {
  await mondayGQL(
    `mutation($b:ID!,$i:ID!,$c:String!,$v:JSON!){ change_column_value(board_id:$b,item_id:$i,column_id:$c,value:$v){ id } }`,
    { b: String(BOARD_ID), i: String(unitId), c: COL.garantias, v: JSON.stringify({ text: arr.length ? JSON.stringify(arr) : '' }) }
  );
}

async function readGarantias(unitId) {
  const d = await mondayGQL(`{ items(ids: [${Number(unitId)}]) { column_values(ids: ["${COL.garantias}"]) { text } } }`);
  return parseGarantias(d.items[0].column_values[0].text);
}

exports.handler = async (event) => {
  const H = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers: H, body: '' };
  if (event.httpMethod !== 'POST')   return { statusCode: 405, headers: H, body: JSON.stringify({ error: 'Método no permitido' }) };

  let body;
  try { body = JSON.parse(event.body || '{}'); } catch (e) { return { statusCode: 400, headers: H, body: JSON.stringify({ error: 'JSON inválido' }) }; }

  const role = roleOf(body.code);
  if (!role) return { statusCode: 401, headers: H, body: JSON.stringify({ error: 'Código incorrecto' }) };

  try {
    // ── LOGIN ──
    if (body.action === 'login') {
      return { statusCode: 200, headers: H, body: JSON.stringify({ ok: true, role }) };
    }

    // ── DATA: unidades + estados + garantías ──
    if (body.action === 'data') {
      const q = `{ boards(ids: [${BOARD_ID}]) { name items_page(limit: 500) { items { id name group { title } column_values(ids: ["${COL.fabricacion}","${COL.cocina}","${COL.tope}","${COL.inspContrat}","${COL.inspCliente}","${COL.garantias}"]) { id text } } } } }`;
      const data  = await mondayGQL(q);
      const board = data.boards[0];
      const units = board.items_page.items.map(it => ({
        id:          it.id,
        name:        it.name,
        grupo:       it.group ? it.group.title : '',
        fabricacion: colText(it, COL.fabricacion),
        cocina:      colText(it, COL.cocina),
        tope:        colText(it, COL.tope),
        inspContrat: colText(it, COL.inspContrat),
        inspCliente: colText(it, COL.inspCliente),
        garantias:   parseGarantias(colText(it, COL.garantias)),
      }));
      return { statusCode: 200, headers: H, body: JSON.stringify({ project: board.name, role, units }) };
    }

    // ── AGREGAR GARANTÍA (cliente o admin) ──
    if (body.action === 'addGarantia') {
      const { unitId, desc, recibe, tel } = body;
      if (!unitId || !desc || !String(desc).trim()) return { statusCode: 400, headers: H, body: JSON.stringify({ error: 'Falta la descripción' }) };
      const arr = await readGarantias(unitId);
      arr.push({
        id:        Date.now(),
        desc:      String(desc).slice(0, 600).trim(),
        recibe:    String(recibe || '').slice(0, 120).trim(),
        tel:       String(tel || '').slice(0, 40).trim(),
        d:         new Date().toISOString(),
        visitDate: '', visitTime: '', fixed: false, fixedDate: '',
      });
      await saveGarantias(unitId, arr);
      return { statusCode: 200, headers: H, body: JSON.stringify({ ok: true }) };
    }

    // ── ACTUALIZAR GARANTÍA (solo admin: visita + arreglado) ──
    if (body.action === 'updateGarantia') {
      if (role !== 'admin') return { statusCode: 403, headers: H, body: JSON.stringify({ error: 'Solo administración' }) };
      const { unitId, garantiaId, visitDate, visitTime, fixed } = body;
      const arr = await readGarantias(unitId);
      const g = arr.find(x => String(x.id) === String(garantiaId));
      if (!g) return { statusCode: 404, headers: H, body: JSON.stringify({ error: 'Garantía no encontrada' }) };
      if (visitDate !== undefined) g.visitDate = visitDate;
      if (visitTime !== undefined) g.visitTime = visitTime;
      if (fixed     !== undefined) { g.fixed = !!fixed; g.fixedDate = fixed ? new Date().toISOString() : ''; }
      await saveGarantias(unitId, arr);
      return { statusCode: 200, headers: H, body: JSON.stringify({ ok: true }) };
    }

    return { statusCode: 400, headers: H, body: JSON.stringify({ error: 'Acción desconocida' }) };
  } catch (e) {
    return { statusCode: 500, headers: H, body: JSON.stringify({ error: e.message }) };
  }
};

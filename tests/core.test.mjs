// Pruebas del núcleo con DATOS INVENTADOS. Ejecutar: node tests/core.test.mjs
import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const code = html.match(/<script id="core">([\s\S]*?)<\/script>/)[1];
const C = new Function(code + `; return {APP_VERSION, STORE_KEY, SCHEMA, DEFAULT_AJUSTES, parseMonto, parseInput, planMerge,
  applyMerge, migrate, waUrl, diasSinGestion, compEstado, todayKey, detectDelim, telActivo, telMarcar, esTercero, properCase, versiones, tramo};`)();

let ok = 0;
const t = (name, fn) => { fn(); ok++; console.log('✓', name); };

const HEAD = ['SafiCreditoID','Status','Oficina','Cliente','Saldo insoluto','Saldo en atraso','Multa','Dias de atraso','Num. Pago','Telefono','Latitud','Longitud','Direccion del negocio'];
const R1 = ['900000001','Mora','CI-PRUEBA','CLIENTE PRUEBA UNO',' $20,212.33 ',' $4,045.00 ',' $928.00 ','7','4 de 12','0000000001','20.6700000','-103.3500000','CALLE  FICTICIA   123,  COLONIA DEMO'];
const R2 = ['900000002','Del Dia','CI-PRUEBA','MARÍA PRUEBA DOS',' $19,566.79 ',' $-   ',' $-   ','0','4 de 8','0000000002','20.6800000','-103.3600000','AV INVENTADA 45, COLONIA EJEMPLO'];
const tsv = rows => rows.map(r=>r.join('\t')).join('\n');

t('clave fija y esquema', ()=>{ assert.equal(C.STORE_KEY,'cobranza_gp_datos'); assert.equal(C.SCHEMA,2); });

t('montos', ()=>{
  assert.equal(C.parseMonto(' $20,212.33 '), 20212.33);
  assert.equal(C.parseMonto(' $-   '), 0);
  assert.equal(C.parseMonto(''), 0);
  assert.ok(Number.isNaN(C.parseMonto('abc')));
});

t('pegado con encabezado (tabuladores)', ()=>{
  const p = C.parseInput(tsv([HEAD,R1,R2]));
  assert.equal(p.conEncabezado, true);
  assert.equal(p.filas.length, 2);
  const d = p.filas[0].data;
  assert.equal(d.id,'900000001'); assert.equal(d.insoluto,20212.33); assert.equal(d.saldo,4045);
  assert.equal(d.multa,928); assert.equal(d.dias,7); assert.equal(d.lat,20.67);
  assert.equal(d.direccion,'CALLE FICTICIA 123, COLONIA DEMO');
  assert.equal(p.filas[1].data.saldo,0);
});

t('encabezado en otro orden', ()=>{
  const order = [3,0,12,1,7,5,2,4,6,8,9,10,11];
  const p = C.parseInput(tsv([order.map(i=>HEAD[i]), order.map(i=>R1[i])]));
  const d = p.filas[0].data;
  assert.equal(d.id,'900000001'); assert.equal(d.cliente,'CLIENTE PRUEBA UNO'); assert.equal(d.dias,7); assert.equal(d.saldo,4045);
});

t('sin encabezado usa orden estándar', ()=>{
  const p = C.parseInput(tsv([R1,R2]));
  assert.equal(p.conEncabezado,false);
  assert.equal(p.filas[1].data.cliente,'MARÍA PRUEBA DOS');
});

t('CSV con comas y con punto y coma (+BOM)', ()=>{
  const q = r => r.map(v=>/[,"]/.test(v)?'"'+v.replace(/"/g,'""')+'"':v).join(',');
  const csv = '﻿' + [HEAD,R1,R2].map(q).join('\r\n');
  assert.equal(C.detectDelim(csv.slice(1)), ',');
  const p = C.parseInput(csv);
  assert.equal(p.filas.length,2); assert.equal(p.filas[0].data.insoluto,20212.33);
  assert.equal(p.filas[0].data.direccion,'CALLE FICTICIA 123, COLONIA DEMO');
  const sc = [HEAD,R1,R2].map(r=>r.join(';')).join('\n');
  const p2 = C.parseInput(sc);
  assert.equal(p2.filas[1].data.id,'900000002'); assert.equal(p2.filas[0].data.saldo,4045);
});

t('errores', ()=>{
  const bad = R1.slice(); bad[0]=''; const bad2 = R2.slice(); bad2[5]='xx';
  const p = C.parseInput(tsv([HEAD,bad,bad2]));
  const plan = C.planMerge(C.migrate(null), p);
  assert.equal(plan.errores,2); assert.equal(plan.nuevas,0);
});

t('mezcla: nuevas, actualizadas, conserva historial/compromisos/asignación, nota automática', ()=>{
  const store = C.migrate(null);
  let plan = C.planMerge(store, C.parseInput(tsv([HEAD,R1,R2])));
  assert.deepEqual([plan.nuevas,plan.actualizadas,plan.errores],[2,0,0]);
  C.applyMerge(store, plan, '2026-10-01T15:00:00.000Z');
  const c = store.cuentas['900000001'];
  assert.equal(c.alta,'2026-10-01T15:00:00.000Z');
  c.assign='yo';
  c.historial.unshift({id:'x', ts:'2026-10-02T15:00:00.000Z', tipo:'Llamada', resultado:'Contactado', comentario:'prueba'});
  c.compromisos.push({id:'k', fecha:'2026-10-20', monto:500, nota:'', estado:'pendiente'});
  const R1b = R1.slice(); R1b[7]='0'; R1b[5]=' $-   ';
  plan = C.planMerge(store, C.parseInput(tsv([HEAD,R1b])));
  assert.deepEqual([plan.nuevas,plan.actualizadas],[0,1]);
  C.applyMerge(store, plan, '2026-10-05T15:00:00.000Z');
  assert.equal(c.dias,0); assert.equal(c.assign,'yo'); assert.equal(c.compromisos.length,1);
  assert.equal(c.historial[0].comentario,'Días de atraso: 7 → 0 · Saldo en atraso: $4,045 → $0');
  assert.equal(c.historial[1].tipo,'Llamada');
  assert.ok(store.cuentas['900000002'], 'la cuenta que no vino en la carga no se borra');
});

t('WhatsApp: wa.me/52 + 10 dígitos, saludo por hora, versiones, sin montos', ()=>{
  const aj = C.DEFAULT_AJUSTES;
  const am = new Date(2026,9,15,9), pm = new Date(2026,9,15,16), noche = new Date(2026,9,15,20);
  const c = {tel:'0000000002', cliente:'MARÍA PRUEBA DOS', status:'Del Dia'};
  const u = C.waUrl(c, aj, false, {now:am, rnd:()=>0});
  assert.ok(u.startsWith('https://wa.me/520000000002?text='));
  const m = decodeURIComponent(u.split('text=')[1]);
  assert.ok(m.startsWith('Buenos días María, soy José Fernández de Crediclub.'), m);
  assert.ok(decodeURIComponent(C.waUrl(c, aj, false, {now:pm, rnd:()=>0})).includes('Buenas tardes María'));
  assert.ok(decodeURIComponent(C.waUrl(c, aj, false, {now:noche, rnd:()=>0})).includes('Buenas noches María'));
  // todas las versiones de todas las plantillas: sin llaves sin reemplazar, sin montos ni cifras, sin él/ella
  for(const k of ['tplDelDia','tplMora','tplTerceroDia','tplTerceroMora']){
    const n = C.versiones(aj[k]).length; assert.ok(n>=2, k);
    for(let i=0;i<n;i++){
      const st = k.includes('Mora') ? 'Mora' : 'Del Dia';
      const t = decodeURIComponent(C.waUrl({...c, status:st}, aj, k.includes('Tercero'), {now:am, rnd:()=>i/n+0.001}).split('text=')[1]);
      assert.ok(!/[{}]|\$|\d|él\/ella/.test(t), k+': '+t);
      if(k.includes('Tercero')) assert.ok(!/pago|adeudo|atraso|deuda|corriente/i.test(t), k+': '+t);
    }
  }
  assert.equal(C.waUrl({tel:'12345'}, aj), null);
});

t('nombre propio con partículas', ()=>{
  assert.equal(C.properCase('ROBERTO NICOLAS DE LA CRUZ'), 'Roberto Nicolas de la Cruz');
  assert.equal(C.properCase('  ana  DEL  RIO '), 'Ana del Rio');
});

t('textos viejos sin editar se actualizan; editados se respetan', ()=>{
  const old = 'Hola {nombre}, buen día. Soy {yo} de Crediclub. Le escribo para recordarle que hoy es su día de pago. Cualquier duda, con gusto le apoyo.';
  const m = C.migrate({schema:2, cuentas:{}, ajustes:{nombre:'Yo', tplDelDia:old, tplMora:'Mi texto propio'}});
  assert.equal(m.ajustes.tplDelDia, C.DEFAULT_AJUSTES.tplDelDia);
  assert.equal(m.ajustes.tplMora, 'Mi texto propio');
  assert.equal(m.ajustes.nombre, 'Yo');
});

t('migración no borra nada', ()=>{
  const old = {cuentas:{'900000003':{cliente:'X', historial:[{tipo:'Visita',ts:'2026-01-01T00:00:00Z'}], extra:'se queda'}}, otraCosa:1};
  const m = C.migrate(JSON.parse(JSON.stringify(old)));
  assert.equal(m.otraCosa,1); assert.equal(m.cuentas['900000003'].extra,'se queda');
  assert.equal(m.cuentas['900000003'].historial.length,1); assert.equal(m.cuentas['900000003'].id,'900000003');
  assert.equal(m.ajustes.nombre,'José Fernández');
});

t('días sin gestión y compromisos', ()=>{
  const now = new Date(2026,9,15,10);
  const c = {alta:new Date(2026,9,10,9).toISOString(), historial:[{tipo:'Sistema',auto:true,ts:new Date(2026,9,14).toISOString()}]};
  assert.equal(C.diasSinGestion(c, now), 5);
  c.historial.unshift({tipo:'WhatsApp', ts:new Date(2026,9,13,18).toISOString()});
  assert.equal(C.diasSinGestion(c, now), 2);
  assert.equal(C.compEstado({estado:'pendiente',fecha:'2026-10-15'},'2026-10-15'),'hoy');
  assert.equal(C.compEstado({estado:'pendiente',fecha:'2026-10-14'},'2026-10-15'),'vencido');
});

t('columnas extra con encabezado se guardan en extras', ()=>{
  const H = HEAD.concat(['Domicilio casa','Referencia']);
  const p = C.parseInput(tsv([H, R1.concat(['CALLE CASA FICTICIA 9','Vecina'])]));
  assert.deepEqual(p.filas[0].data.extras, {'Domicilio casa':'CALLE CASA FICTICIA 9','Referencia':'Vecina'});
  assert.equal(p.filas[0].data.direccion,'CALLE FICTICIA 123, COLONIA DEMO');
  const store = C.migrate(null);
  C.applyMerge(store, C.planMerge(store,p), '2026-10-01T00:00:00Z');
  assert.equal(store.cuentas['900000001'].extras['Referencia'],'Vecina');
  // carga posterior sin esas columnas no las borra
  C.applyMerge(store, C.planMerge(store, C.parseInput(tsv([HEAD,R1]))), '2026-10-02T00:00:00Z');
  assert.equal(store.cuentas['900000001'].extras['Referencia'],'Vecina');
});

t('teléfono agregado: activo para llamar/WhatsApp, original se conserva; marcar sin +52', ()=>{
  const store = C.migrate(null);
  C.applyMerge(store, C.planMerge(store, C.parseInput(tsv([HEAD,R1]))), '2026-10-01T00:00:00Z');
  const c = store.cuentas['900000001'];
  assert.equal(C.telActivo(c),'0000000001');
  c.telefonos.push({num:'0000000099', quien:'Familiar'}); c.telActivo='0000000099';
  assert.equal(C.telActivo(c),'0000000099');
  assert.ok(C.waUrl(Object.assign({},c,{tel:C.telActivo(c)}), store.ajustes, true).startsWith('https://wa.me/520000000099?'));
  // recarga de la lista actualiza el original pero no cambia el teléfono en uso
  const R1c = R1.slice(); R1c[9] = '+52 00 0000 0055';
  C.applyMerge(store, C.planMerge(store, C.parseInput(tsv([HEAD,R1c]))), '2026-10-02T00:00:00Z');
  assert.equal(c.tel,'0000000055'); assert.equal(C.telActivo(c),'0000000099');
  assert.equal(C.telMarcar('+52 33 1234 5678'),'3312345678');
});

t('migración v1 → v2 agrega campos sin borrar', ()=>{
  const v1 = {schema:1, cuentas:{'900000004':{id:'900000004', tel:'523300000000', historial:[{tipo:'Visita'}], compromisos:[]}}};
  const m = C.migrate(v1);
  const c = m.cuentas['900000004'];
  assert.equal(m.schema,2); assert.deepEqual(c.telefonos,[]); assert.equal(c.telActivo,''); assert.deepEqual(c.extras,{});
  assert.equal(c.tel,'3300000000'); assert.equal(c.historial.length,1);
});

t('plantillas de tercero: sin montos ni adeudo, con nombre completo', ()=>{
  const aj = C.DEFAULT_AJUSTES;
  const c = {tel:'0000000099', cliente:'CLIENTE PRUEBA UNO', status:'Mora', telActivo:'0000000099', telefonos:[{num:'0000000099', quien:'Familiar'}]};
  assert.equal(C.esTercero(c), true);
  const m = decodeURIComponent(C.waUrl(c, aj, true, {rnd:()=>0}).split('text=')[1]);
  assert.ok(m.includes('Cliente Prueba Uno') && m.includes('José Fernández'), m);
  assert.ok(!/pago|adeudo|atraso|deuda|\$|\d/i.test(m), m);
  const d = decodeURIComponent(C.waUrl({...c, status:'Del Dia'}, aj, true).split('text=')[1]);
  assert.ok(!/pago|adeudo|atraso|deuda|\$|\d/i.test(d), d);
  assert.equal(C.esTercero({telActivo:'0000000099', telefonos:[{num:'0000000099', quien:'Cliente'}]}), false);
  assert.equal(C.esTercero({telActivo:'', telefonos:[]}), false);
  // ajustes viejos (v1.1) reciben las plantillas nuevas al migrar
  const mg = C.migrate({schema:2, ajustes:{nombre:'Yo', tplMora:'X'}, cuentas:{}});
  assert.equal(mg.ajustes.tplMora,'X'); assert.equal(mg.ajustes.tplTerceroMora, aj.tplTerceroMora);
});

t('pegado sin tabuladores: si se reconoce la forma se lee; si no, error', ()=>{
  const linea = '900000005 Del Dia CI-DEMO CLIENTE PRUEBA CINCO $19,566.79 $- $- 0 4 DE 8 0000000005 20.62 -103.40 CALLE FICTICIA 9, COLONIA DEMO, ZAPOPAN, JALISCO. C.P. 45000';
  const p = C.parseInput(linea);
  assert.equal(p.modoEspacios, true); assert.deepEqual(p.filas[0].errores, []);
  assert.equal(p.filas[0].data.cliente, 'CLIENTE PRUEBA CINCO'); assert.equal(p.filas[0].data.direccion, 'CALLE FICTICIA 9, COLONIA DEMO, ZAPOPAN, JALISCO. C.P. 45000');
  const basura = C.parseInput('cliente prueba, sin formato, 123, otra cosa');
  assert.ok(basura.filas[0].errores.length > 0);
  assert.equal(C.planMerge(C.migrate(null), basura).nuevas, 0);
  // fila con columnas de menos
  const p2 = C.parseInput(tsv([R1.slice(0,10)]));
  assert.ok(p2.filas[0].errores.some(e=>e.includes('columnas')));
  // coordenadas corridas
  const R1x = R1.slice(); R1x[10] = '-103.35'; R1x[11] = '20.67';
  const p3 = C.parseInput(tsv([HEAD, R1x]));
  assert.ok(p3.filas[0].errores.some(e=>e.includes('fuera de México')));
});

t('pegado desde WhatsApp en celular (tabuladores convertidos en espacios)', ()=>{
  // Mismo formato del Excel real, con datos inventados; los tabuladores se vuelven espacios.
  const filasTab = [
    ['900000011','Del Dia','CI-PRUEBA','ANA LUCIA PRUEBA UNO',' $20,212.33 ',' $-   ',' $-   ','0','5 de 8','0000000011','20.5099739','-103.3635928','CALLE FICTICIA 7  COLONIA DEMO, TLAQUEPAQUE, JALISCO. C.P. 45000'],
    ['900000012','Mora','CI-PRUEBA','ROBERTO NICOLAS DE LA PRUEBA',' $33,197.41 ',' $4,045.00 ',' $928.00 ','7','4 de 12','0000000012','20.6974495','-103.3634862','Calle de prueba 1760 , COL. EJEMPLO, GUADALAJARA, JALISCO, C.P. 44000'],
    ['900000013','Mora','CI-DEMO','CLIENTE SIN UBICACION',' $1,000.00 ',' $500.00 ',' $-   ','3','2 de 8','0000000013','','',''],
  ];
  const txt = [HEAD.join(' ')].concat(filasTab.map(r=>r.join(' '))).join('\n');
  assert.ok(!txt.includes('\t'));
  const p = C.parseInput(txt);
  assert.equal(p.modoEspacios, true);
  assert.equal(p.filas.length, 3);
  for(const f of p.filas) assert.deepEqual(f.errores, [], JSON.stringify(f));
  const [a,b,c] = p.filas.map(f=>f.data);
  assert.equal(a.id,'900000011'); assert.equal(a.status,'Del Dia'); assert.equal(a.oficina,'CI-PRUEBA');
  assert.equal(a.cliente,'ANA LUCIA PRUEBA UNO'); assert.equal(a.insoluto,20212.33); assert.equal(a.saldo,0);
  assert.equal(a.pago,'5 de 8'); assert.equal(a.tel,'0000000011'); assert.equal(a.lat,20.5099739); assert.equal(a.lng,-103.3635928);
  assert.equal(a.direccion,'CALLE FICTICIA 7 COLONIA DEMO, TLAQUEPAQUE, JALISCO. C.P. 45000');
  assert.equal(b.status,'Mora'); assert.equal(b.cliente,'ROBERTO NICOLAS DE LA PRUEBA'); assert.equal(b.saldo,4045); assert.equal(b.multa,928); assert.equal(b.dias,7);
  assert.equal(c.lat,null); assert.equal(c.direccion,'');
  // y el mismo texto con tabuladores sigue funcionando por la vía normal
  const pt = C.parseInput([HEAD].concat(filasTab).map(r=>r.join('\t')).join('\n'));
  assert.ok(!pt.modoEspacios); assert.equal(pt.filas.filter(f=>!f.errores.length).length, 3);
  // CSV de archivo con comas sigue por la vía normal
  const q = r => r.map(v=>/[,"]/.test(v)?'"'+v+'"':v).join(',');
  const pc = C.parseInput([HEAD].concat(filasTab).map(q).join('\n'));
  assert.ok(!pc.modoEspacios); assert.equal(pc.filas.filter(f=>!f.errores.length).length, 3);
});

t('tramos de atraso', ()=>{
  assert.equal(C.tramo({status:'Del Dia', dias:0}), 'dia');
  assert.equal(C.tramo({status:'Mora', dias:1}), 'm1');
  assert.equal(C.tramo({status:'Mora', dias:7}), 'm1');
  assert.equal(C.tramo({status:'Mora', dias:8}), 'm8');
  assert.equal(C.tramo({status:'Mora', dias:45}), 'm8');
  assert.equal(C.tramo({status:'Mora', dias:0}), 'm1');
});

console.log(`\n${ok} pruebas OK`);

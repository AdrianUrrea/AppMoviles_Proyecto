import type { TipoDato } from '../dinero/formularios';
import type { CampoPerfil } from './logica';
import { normalizarBusqueda } from './logica';

/**
 * Catalogo de tramites del SAT para personas fisicas.
 *
 * IMPORTANTE: esta app NO envia nada al SAT ni pide contrasena o e.firma. Solo prepara los datos del usuario
 * y lo lleva al sitio oficial, donde el hace el tramite.
 *
 * Los requisitos y rutas son ORIENTATIVOS: se tomaron de publicaciones del SAT y de medios fiscales y
 * pueden cambiar. Por eso cada tramite lleva el aviso de confirmar en la ficha oficial y la fecha de revision.
 * Para agregar un tramite: sumar una entrada aqui (las pruebas validan enlaces y campos).
 */

export const VERIFICADO_EN = 'noviembre de 2026';

export type CategoriaId = 'declaraciones' | 'rfc' | 'firma' | 'constancias' | 'atencion';
export type AccesoId = 'contrasena' | 'efirma' | 'identificacion' | 'cita';

export const CATEGORIAS: readonly { id: CategoriaId; titulo: string }[] = [
  { id: 'declaraciones', titulo: 'Declaraciones' },
  { id: 'rfc', titulo: 'RFC y datos fiscales' },
  { id: 'firma', titulo: 'Contraseña y e.firma' },
  { id: 'constancias', titulo: 'Constancias y cumplimiento' },
  { id: 'atencion', titulo: 'Citas y atención' },
];

export const ACCESOS: Record<AccesoId, string> = {
  contrasena: 'Contraseña del SAT',
  efirma: 'e.firma',
  identificacion: 'Identificación oficial',
  cita: 'Cita previa',
};

const PORTAL = 'https://www.sat.gob.mx/';
/** Pagina publica "Declaraciones y pagos personas fisicas" (direccion vista en el portal, nov 2026). */
const DECLARACIONES_PF = 'https://www.sat.gob.mx/portal/public/tramites/declaraciones-pf';
const CITAS = 'https://citas.sat.gob.mx/';
const SAT_ID = 'https://satid.sat.gob.mx/';
const FICHA_OPINION = 'https://www.sat.gob.mx/gobmx/Paginas/ficha_1_cff.html';
const ACUSES_RFC = 'https://wwwmat.sat.gob.mx/aplicacion/43824/reimprime-tus-acuses-del-rfc';

export type Tramite = {
  id: string;
  titulo: string;
  categoria: CategoriaId;
  descripcion: string;
  /** Palabras que ayudan a encontrarlo en la busqueda. */
  etiquetas: readonly string[];
  acceso: readonly AccesoId[];
  /** Lo que el usuario debe tener a la mano. */
  requisitos: readonly string[];
  /** Menus por los que se llega al tramite en el portal. */
  ruta: readonly string[];
  /** Datos del perfil que se muestran listos para copiar. */
  datos: readonly CampoPerfil[];
  enlaces: readonly { titulo: string; url: string }[];
  /** Formularios de datos de dinero que ayudan a preparar este tramite. */
  datosDinero?: readonly TipoDato[];
  notas?: string;
};

const DOMICILIO: readonly CampoPerfil[] = ['calle', 'numExt', 'numInt', 'colonia', 'cp', 'municipio', 'estado'];

export const TRAMITES: readonly Tramite[] = [
  {
    id: 'declaracion-anual',
    titulo: 'Declaración anual de personas físicas',
    categoria: 'declaraciones',
    descripcion: 'Presenta tu declaración anual desde el portal del SAT.',
    etiquetas: ['anual', 'impuestos', 'isr', 'saldo a favor', 'devolucion'],
    acceso: ['contrasena', 'efirma'],
    requisitos: [
      'RFC con homoclave (13 caracteres)',
      'Contraseña del SAT vigente o e.firma vigente',
      'Información de tus ingresos y deducciones del ejercicio (constancias, recibos, facturas)',
      'Si tienes saldo a favor y pides devolución: una cuenta bancaria a tu nombre',
    ],
    ruta: [
      'Abre la página "Declaraciones y pagos personas físicas" (botón de abajo)',
      'En "Inicia el trámite" elige "Anual"',
      'Inicia sesión con tu RFC y contraseña (o e.firma) y resuelve el captcha',
      'Sigue las pantallas hasta enviar',
    ],
    datos: ['rfc'],
    datosDinero: ['anual', 'cuenta'],
    enlaces: [{ titulo: 'Declaraciones y pagos (personas físicas)', url: DECLARACIONES_PF }],
    notas: 'La declaración la firmas y envías tú dentro del portal. Esta app nunca te pedirá tu contraseña ni tu e.firma.',
  },
  {
    id: 'declaraciones-pagos',
    titulo: 'Otras declaraciones y pagos',
    categoria: 'declaraciones',
    descripcion: 'ISR, IVA, IEPS e informativas: provisionales, definitivas y pagos de derechos, según tus obligaciones.',
    etiquetas: ['mensual', 'provisional', 'informativa', 'pago', 'iva', 'resico'],
    acceso: ['contrasena', 'efirma'],
    requisitos: [
      'RFC y contraseña o e.firma vigente',
      'Saber qué obligaciones tienes registradas (tu Constancia de Situación Fiscal las muestra)',
      'La información del periodo que vas a declarar',
    ],
    ruta: [
      'Abre la página "Declaraciones y pagos personas físicas" (botón de abajo)',
      'En "Inicia el trámite" elige: Provisionales y definitivas, Informativas, Declaraciones de plataformas tecnológicas o Derechos, productos y aprovechamientos (DPA)',
      'Inicia sesión y sigue las pantallas',
    ],
    datos: ['rfc'],
    datosDinero: ['mensual'],
    enlaces: [{ titulo: 'Declaraciones y pagos (personas físicas)', url: DECLARACIONES_PF }],
    notas: 'Qué declaraciones te tocan depende de tu régimen y actividad. Si no estás seguro, consúltalo con un contador.',
  },
  {
    id: 'inscripcion-rfc',
    titulo: 'Inscripción al RFC (persona física)',
    categoria: 'rfc',
    descripcion: 'Date de alta en el Registro Federal de Contribuyentes, en oficina o por videollamada (Oficina Virtual).',
    etiquetas: ['alta', 'registro', 'rfc', 'inscribirme', 'oficina virtual'],
    acceso: ['identificacion', 'cita'],
    requisitos: [
      'CURP',
      'Identificación oficial vigente (original)',
      'Comprobante de domicilio (puede no pedirse si tu identificación ya muestra tu domicilio)',
      'Correo electrónico activo',
      'Cita registrada en citas.sat.gob.mx',
    ],
    ruta: [
      'Entra a citas.sat.gob.mx',
      'Elige "Inscripción al padrón de contribuyentes Personas Físicas"',
      'Escoge oficina o Oficina Virtual (videollamada) y agenda',
    ],
    datos: ['nombre', 'apellidoPaterno', 'apellidoMaterno', 'nacimiento', 'correo', ...DOMICILIO],
    enlaces: [{ titulo: 'Citas del SAT', url: CITAS }],
    notas: 'Los requisitos exactos varían según el caso; confirma en la ficha de trámite 39/CFF. Todos los trámites del SAT son gratuitos.',
  },
  {
    id: 'visores',
    titulo: 'Visores: tus comprobantes y deducciones',
    categoria: 'declaraciones',
    descripcion: 'Consulta tus comprobantes de nómina, tus deducciones personales y las facturas emitidas o recibidas.',
    etiquetas: ['visor', 'nomina', 'facturas', 'cfdi', 'deducciones', 'comprobantes'],
    acceso: ['contrasena', 'efirma'],
    requisitos: [
      'Tus credenciales del SAT (el portal indica cuáles pide cada visor)',
      'Úsalo antes de declarar: te ayuda a reunir tus cifras reales para capturarlas en "Mis datos de dinero"',
    ],
    ruta: [
      'Abre la página "Declaraciones y pagos personas físicas" (botón de abajo)',
      'En "Inicia el trámite" elige "Visores"',
      'Escoge el visor que necesites (nómina, deducciones personales o facturas)',
    ],
    datos: ['rfc'],
    datosDinero: ['anual'],
    enlaces: [{ titulo: 'Declaraciones y pagos (personas físicas)', url: DECLARACIONES_PF }],
    notas: 'Los visores muestran lo que el SAT tiene registrado. Compáralo con tus propios comprobantes antes de declarar.',
  },
  {
    id: 'constancia-situacion-fiscal',
    titulo: 'Constancia de Situación Fiscal',
    categoria: 'constancias',
    descripcion: 'Documento que muestra tu RFC, tu domicilio fiscal, tu régimen y tus obligaciones.',
    etiquetas: ['csf', 'cif', 'cedula', 'constancia', 'situacion fiscal'],
    acceso: ['contrasena', 'efirma', 'identificacion'],
    requisitos: [
      'Con contraseña o e.firma: entras directo al portal',
      'Sin ellas (personas físicas): identificación oficial vigente en original, por SAT ID u Oficina Virtual',
    ],
    ruta: [
      'sat.gob.mx → Trámites y servicios → Más trámites y servicios',
      'Constancias, devoluciones y notificaciones',
      'Constancia de Situación Fiscal',
    ],
    datos: ['rfc'],
    enlaces: [
      { titulo: 'Portal del SAT', url: PORTAL },
      { titulo: 'SAT ID (con identificación)', url: SAT_ID },
    ],
  },
  {
    id: 'reimprimir-acuses-rfc',
    titulo: 'Reimprimir acuses del RFC',
    categoria: 'rfc',
    descripcion: 'Vuelve a imprimir los acuses de los avisos que hiciste en el RFC.',
    etiquetas: ['acuse', 'avisos', 'reimprimir', 'rfc'],
    acceso: ['contrasena', 'efirma'],
    requisitos: ['Tu RFC', 'Tus credenciales del SAT, según indique la propia página'],
    ruta: ['Abre el enlace oficial', 'Ingresa con tus credenciales y elige el acuse que necesitas'],
    datos: ['rfc'],
    enlaces: [{ titulo: 'Reimprime tus acuses del RFC', url: ACUSES_RFC }],
  },
  {
    id: 'cambio-domicilio',
    titulo: 'Cambio de domicilio o corrección de datos',
    categoria: 'rfc',
    descripcion: 'Actualiza tu domicilio fiscal o corrige tu nombre en el RFC.',
    etiquetas: ['domicilio', 'actualizar', 'nombre', 'correccion', 'oficina virtual'],
    acceso: ['identificacion', 'cita'],
    requisitos: [
      'Cita en citas.sat.gob.mx (también disponible por Oficina Virtual)',
      'Identificación oficial vigente',
      'Los documentos que pida la ficha del trámite (normalmente, un comprobante de tu nuevo domicilio)',
    ],
    ruta: ['Entra a citas.sat.gob.mx', 'Elige el servicio de actualización de datos que corresponda', 'Agenda tu cita'],
    datos: ['nombre', 'apellidoPaterno', 'apellidoMaterno', 'rfc', ...DOMICILIO],
    enlaces: [{ titulo: 'Citas del SAT', url: CITAS }],
    notas: 'Confirma en la ficha oficial qué documentos pide tu caso: aquí no podemos saberlo.',
  },
  {
    id: 'contrasena-sat',
    titulo: 'Contraseña del SAT',
    categoria: 'firma',
    descripcion: 'Genera o actualiza tu contraseña para entrar a los servicios del portal.',
    etiquetas: ['contrasena', 'clave', 'acceso', 'ciec'],
    acceso: ['efirma', 'identificacion'],
    requisitos: [
      'Con e.firma vigente el proceso es más sencillo',
      'Las personas físicas también pueden generarla sin e.firma; el portal guía el proceso',
      'Un correo electrónico activo',
    ],
    ruta: ['sat.gob.mx → Trámites y servicios', 'Contraseña → Generación o actualización de personas físicas'],
    datos: ['rfc', 'correo'],
    enlaces: [{ titulo: 'Portal del SAT', url: PORTAL }],
    notas: 'La ruta de menús es orientativa: el portal cambia. Tu contraseña es personal, nadie debe pedírtela.',
  },
  {
    id: 'efirma',
    titulo: 'e.firma (primera vez o renovación)',
    categoria: 'firma',
    descripcion: 'Tu firma electrónica avanzada para trámites y declaraciones.',
    etiquetas: ['firma', 'efirma', 'fiel', 'renovar', 'certificado'],
    acceso: ['identificacion', 'cita'],
    requisitos: [
      'Cita registrada en citas.sat.gob.mx (servicio de e.firma para personas físicas)',
      'Identificación oficial vigente, en original',
      'CURP y RFC',
    ],
    ruta: ['Entra a citas.sat.gob.mx', 'Selecciona el servicio de e.firma para personas físicas', 'Elige una oficina con disponibilidad'],
    datos: ['nombre', 'apellidoPaterno', 'apellidoMaterno', 'rfc', 'correo'],
    enlaces: [{ titulo: 'Citas del SAT', url: CITAS }],
    notas: 'Tu e.firma es personal. Guarda sus archivos y su contraseña: ni el SAT ni nadie debe pedírtelos por mensaje.',
  },
  {
    id: 'opinion-cumplimiento',
    titulo: 'Opinión de cumplimiento (32-D)',
    categoria: 'constancias',
    descripcion: 'Consulta si estás al corriente en tus obligaciones fiscales.',
    etiquetas: ['32-d', '32d', 'opinion', 'cumplimiento', 'obligaciones'],
    acceso: ['contrasena', 'efirma'],
    requisitos: ['Contraseña o e.firma vigente', 'Tu RFC'],
    ruta: [
      'sat.gob.mx → Otros trámites y servicios',
      '"Opinión del cumplimiento de obligaciones fiscales"',
      'Revisa, imprime y conserva el informe',
    ],
    datos: ['rfc'],
    enlaces: [
      { titulo: 'Portal del SAT', url: PORTAL },
      { titulo: 'Ficha oficial del trámite', url: FICHA_OPINION },
    ],
    notas: 'El resultado puede ser positivo, negativo, en suspensión o sin obligaciones. Con resultado negativo, pide aclaración en el SAT.',
  },
  {
    id: 'sat-id',
    titulo: 'SAT ID (trámites con identificación)',
    categoria: 'atencion',
    descripcion: 'Solicita tu Constancia de Situación Fiscal sin contraseña ni e.firma, con tu identificación.',
    etiquetas: ['satid', 'sat id', 'identificacion', 'constancia', 'sin contrasena'],
    acceso: ['identificacion'],
    requisitos: [
      'Identificación oficial vigente (original)',
      'Un teléfono con cámara (para la app SAT ID)',
      'Ser persona física mayor de 18 años',
    ],
    ruta: ['Abre satid.sat.gob.mx o descarga la app SAT ID', 'Elige "Constancia de Situación Fiscal con CIF" y sigue los pasos'],
    datos: ['nombre', 'apellidoPaterno', 'apellidoMaterno', 'rfc', 'correo'],
    enlaces: [{ titulo: 'SAT ID', url: SAT_ID }],
    notas: 'La respuesta puede tardar hasta cinco días hábiles.',
  },
  {
    id: 'cita-sat',
    titulo: 'Agendar una cita en el SAT',
    categoria: 'atencion',
    descripcion: 'Reserva atención en oficina o por Oficina Virtual para RFC, e.firma, constancias y más.',
    etiquetas: ['cita', 'oficina', 'modulo', 'atencion', 'oficina virtual'],
    acceso: ['cita'],
    requisitos: ['El servicio que necesitas', 'CURP, nombre completo y correo electrónico (los pide el sistema para algunos servicios)'],
    ruta: ['Entra a citas.sat.gob.mx', 'Selecciona "Registrar cita"', 'Elige servicio, oficina y horario'],
    datos: ['nombre', 'apellidoPaterno', 'apellidoMaterno', 'correo'],
    enlaces: [{ titulo: 'Citas del SAT', url: CITAS }],
    notas: 'Gestionar una cita no cuesta. Si alguien te cobra por ello, denúncialo en denuncias@sat.gob.mx.',
  },
];

export function buscarTramite(id: string): Tramite | undefined {
  return TRAMITES.find((t) => t.id === id);
}

/** Filtra por categoria y por texto (sin acentos ni mayusculas) en titulo, descripcion y etiquetas. */
export function filtrarTramites(
  lista: readonly Tramite[],
  texto: string,
  categoria: CategoriaId | 'todas',
): Tramite[] {
  const q = normalizarBusqueda(texto);
  return lista.filter((t) => {
    if (categoria !== 'todas' && t.categoria !== categoria) return false;
    if (!q) return true;
    const pajar = normalizarBusqueda([t.titulo, t.descripcion, ...t.etiquetas].join(' '));
    return q.split(/\s+/).every((palabra) => pajar.includes(palabra));
  });
}

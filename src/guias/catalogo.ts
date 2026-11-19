import { normalizarBusqueda } from '../tramites/logica';

/**
 * Guias de terminos basicos para quien no conoce el lenguaje del SAT.
 *
 * Cada guia explica UN termino en lenguaje sencillo y lo conecta con los tramites donde se usa.
 * Son informativas y ORIENTATIVAS: se revisaron con publicaciones del SAT y de medios fiscales y pueden cambiar.
 * Para agregar una: sumar una entrada aqui (las pruebas validan ids, categorias y enlaces a tramites y guias).
 * Escribe como si le explicaras a alguien que nunca ha hecho un tramite: sin siglas sin explicar y frases cortas.
 */

export type CategoriaGuiaId = 'basicos' | 'acceso' | 'documentos' | 'impuestos';

export const CATEGORIAS_GUIA: readonly { id: CategoriaGuiaId; titulo: string; descripcion: string }[] = [
  { id: 'basicos', titulo: 'Lo básico', descripcion: 'Quién es quién y cómo te identifica el SAT.' },
  { id: 'acceso', titulo: 'Para entrar y firmar', descripcion: 'Claves y herramientas para usar el portal.' },
  { id: 'documentos', titulo: 'Documentos y comprobantes', descripcion: 'Papeles que te piden o que vas a recibir.' },
  { id: 'impuestos', titulo: 'Impuestos y declaraciones', descripcion: 'Qué pagas, qué declaras y cómo se calcula.' },
];

export type Guia = {
  id: string;
  /** El termino tal como lo veras en el portal (RFC, e.firma...). */
  titulo: string;
  categoria: CategoriaGuiaId;
  /** Una linea: que es, dicho de forma simple. */
  resumen: string;
  /** Explicacion, un parrafo por elemento. */
  queEs: readonly string[];
  /** Para que te sirve o cuando lo vas a necesitar. */
  paraQue: readonly string[];
  /** Donde se consigue o se consulta. */
  dondeLoEncuentras?: readonly string[];
  ejemplo?: string;
  /** Advertencia o consejo importante. */
  ojo?: string;
  /** Otros nombres o palabras con las que la gente lo busca. */
  etiquetas: readonly string[];
  /** Ids de otras guias que conviene leer despues. */
  relacionadas: readonly string[];
  /** Ids de tramites (src/tramites/catalogo.ts) donde se usa este termino. */
  tramites: readonly string[];
};

export const GUIAS: readonly Guia[] = [
  // ---------- Lo basico ----------
  {
    id: 'sat',
    titulo: 'SAT',
    categoria: 'basicos',
    resumen: 'La oficina del gobierno que registra y cobra los impuestos.',
    queEs: [
      'SAT significa Servicio de Administración Tributaria. Es la dependencia del gobierno de México que registra a quienes pagan impuestos, recibe sus declaraciones y les entrega documentos como la Constancia de Situación Fiscal.',
    ],
    paraQue: [
      'Ahí te das de alta para pagar impuestos (obtienes tu RFC).',
      'Ahí presentas tu declaración anual.',
      'Ahí sacas constancias y agendas citas de atención.',
    ],
    ojo: 'Todos los trámites del SAT son gratuitos. Si alguien te cobra por hacerlos, no es el SAT. Su sitio oficial termina en sat.gob.mx.',
    etiquetas: ['servicio de administracion tributaria', 'hacienda', 'gobierno', 'impuestos'],
    relacionadas: ['rfc', 'persona-fisica'],
    tramites: ['cita-sat', 'inscripcion-rfc'],
  },
  {
    id: 'persona-fisica',
    titulo: 'Persona física',
    categoria: 'basicos',
    resumen: 'Eres tú como individuo, no una empresa.',
    queEs: [
      'Para el SAT, una persona física es cualquier persona que trabaja o tiene ingresos a su nombre. Lo contrario es una persona moral: una empresa o sociedad.',
      'La mayoría de los trámites de esta app son para personas físicas.',
    ],
    paraQue: [
      'Define con qué reglas pagas impuestos y qué declaraciones te tocan.',
      'Los trámites de empresas son distintos; revisa que el que abras diga “personas físicas”.',
    ],
    ejemplo:
      'Una empleada con sueldo, un diseñador que cobra por proyecto o una persona que renta un departamento son personas físicas. Una sociedad anónima es una persona moral.',
    etiquetas: ['persona moral', 'empresa', 'individuo', 'pf'],
    relacionadas: ['rfc', 'regimen-fiscal'],
    tramites: ['inscripcion-rfc', 'declaracion-anual'],
  },
  {
    id: 'rfc',
    titulo: 'RFC',
    categoria: 'basicos',
    resumen: 'La clave con la que el SAT te identifica.',
    queEs: [
      'RFC significa Registro Federal de Contribuyentes. Es tu clave personal ante el SAT. En una persona física tiene 13 caracteres entre letras y números.',
      'Se forma así: 4 letras que salen de tu nombre y apellidos, 6 números con tu fecha de nacimiento (año, mes y día) y 3 caracteres finales que se llaman homoclave.',
    ],
    paraQue: [
      'Es lo primero que te piden para entrar al portal, declarar o hacer una factura.',
      'Tu patrón lo necesita para pagarte con nómina.',
      'Bancos y otras instituciones lo piden para abrir cuentas o dar créditos.',
    ],
    dondeLoEncuentras: [
      'En tu Constancia de Situación Fiscal.',
      'En las facturas que recibes o emites.',
    ],
    ejemplo:
      'Ejemplo inventado: GOMA900412XY7. GOMA son letras de un nombre, 900412 indica nacimiento el 12 de abril de 1990 y XY7 es la homoclave.',
    ojo: 'Escríbelo en mayúsculas y sin espacios. Un RFC de 12 caracteres es de una empresa, no de una persona.',
    etiquetas: ['registro federal de contribuyentes', 'clave', 'contribuyente', 'alta'],
    relacionadas: ['homoclave', 'curp', 'constancia-situacion-fiscal'],
    tramites: ['inscripcion-rfc', 'constancia-situacion-fiscal', 'reimprimir-acuses-rfc'],
  },
  {
    id: 'homoclave',
    titulo: 'Homoclave',
    categoria: 'basicos',
    resumen: 'Los últimos 3 caracteres de tu RFC.',
    queEs: [
      'La homoclave son tres letras o números que el SAT agrega al final de tu RFC para distinguirte de otra persona con el mismo nombre y la misma fecha de nacimiento.',
    ],
    paraQue: [
      'Sin ella tu RFC queda incompleto (10 caracteres) y el portal no lo acepta.',
      'Por eso a veces se le llama “RFC con homoclave”.',
    ],
    dondeLoEncuentras: ['Es la parte final de tu RFC. Míralo completo en tu Constancia de Situación Fiscal.'],
    ojo: 'La asigna el SAT. No intentes adivinarla: copia tu RFC completo de un documento oficial.',
    etiquetas: ['rfc con homoclave', 'ultimos tres', '13 caracteres'],
    relacionadas: ['rfc', 'constancia-situacion-fiscal'],
    tramites: ['declaracion-anual', 'constancia-situacion-fiscal'],
  },
  {
    id: 'curp',
    titulo: 'CURP',
    categoria: 'basicos',
    resumen: 'La clave de 18 caracteres que te identifica como habitante de México.',
    queEs: [
      'CURP significa Clave Única de Registro de Población. Son 18 caracteres entre letras y números. Es distinta del RFC: la CURP te identifica como persona, el RFC te identifica ante el SAT.',
    ],
    paraQue: [
      'Te la piden para inscribirte al RFC y para hacer trámites con SAT ID.',
      'También se usa en trámites escolares, de salud y de gobierno.',
    ],
    dondeLoEncuentras: [
      'En tu acta de nacimiento.',
      'Puedes descargar tu constancia de CURP gratis en el sitio oficial gob.mx/curp.',
    ],
    ojo: 'Esta app no guarda tu CURP. Ten a la mano la tuya cuando un trámite la pida.',
    etiquetas: ['clave unica de registro de poblacion', 'identificacion', '18 caracteres'],
    relacionadas: ['rfc', 'sat-id'],
    tramites: ['inscripcion-rfc', 'sat-id', 'cita-sat'],
  },
  {
    id: 'ejercicio-fiscal',
    titulo: 'Ejercicio fiscal',
    categoria: 'basicos',
    resumen: 'El año del que estás declarando.',
    queEs: [
      'Es el periodo de un año, del 1 de enero al 31 de diciembre, sobre el que haces cuentas con el SAT.',
      'Lo ves seguido en el portal: te pide elegir el “ejercicio” antes de empezar tu declaración.',
    ],
    paraQue: [
      'Te ayuda a elegir el año correcto: declaras el año que ya terminó, no el que estás viviendo.',
      'Tus ingresos y gastos cuentan en el ejercicio en que los recibiste o pagaste.',
    ],
    ejemplo: 'En abril de 2027 presentarías tu declaración anual del ejercicio 2026.',
    etiquetas: ['ejercicio', 'año fiscal', 'periodo', 'anio'],
    relacionadas: ['declaracion-anual', 'ingresos'],
    tramites: ['declaracion-anual'],
  },
  {
    id: 'regimen-fiscal',
    titulo: 'Régimen fiscal',
    categoria: 'basicos',
    resumen: 'La categoría con la que el SAT te registra según de dónde viene tu dinero.',
    queEs: [
      'El régimen fiscal es el “tipo” de contribuyente que eres para el SAT. Depende de cómo ganas dinero y define qué impuestos pagas y qué declaraciones te tocan.',
      'Algunos ejemplos: sueldos y salarios (trabajas para un patrón), actividad empresarial y profesional (negocio u honorarios), arrendamiento (rentas) y el Régimen Simplificado de Confianza, conocido como RESICO.',
    ],
    paraQue: [
      'Te lo piden al pedir una factura y al declarar.',
      'Una persona puede tener más de un régimen a la vez.',
    ],
    dondeLoEncuentras: ['En tu Constancia de Situación Fiscal, en la sección de regímenes.'],
    ojo: 'Si no estás seguro de qué régimen te conviene o te corresponde, consúltalo con un contador.',
    etiquetas: ['resico', 'sueldos y salarios', 'honorarios', 'arrendamiento', 'actividad empresarial', 'obligaciones'],
    relacionadas: ['constancia-situacion-fiscal', 'declaracion-mensual'],
    tramites: ['constancia-situacion-fiscal', 'declaraciones-pagos'],
  },

  // ---------- Para entrar y firmar ----------
  {
    id: 'contrasena',
    titulo: 'Contraseña del SAT',
    categoria: 'acceso',
    resumen: 'La clave que eliges para entrar al portal junto con tu RFC.',
    queEs: [
      'Es una contraseña que tú creas para entrar a los servicios del SAT. Se usa junto con tu RFC. Antes se llamaba CIEC.',
    ],
    paraQue: [
      'Entrar al portal para declarar, ver tus comprobantes o descargar tu constancia.',
      'Es la forma más común de acceso para una persona física.',
    ],
    dondeLoEncuentras: [
      'Se genera en una oficina del SAT con cita.',
      'Si cumples los requisitos, también puedes generarla o renovarla con SAT ID desde tu celular.',
    ],
    ojo: 'Es personal. Nadie del SAT te la pedirá por teléfono, mensaje o correo, y esta app tampoco. No la compartas.',
    etiquetas: ['ciec', 'clave', 'password', 'acceso', 'entrar'],
    relacionadas: ['efirma', 'sat-id', 'rfc'],
    tramites: ['contrasena-sat', 'declaracion-anual', 'visores'],
  },
  {
    id: 'efirma',
    titulo: 'e.firma',
    categoria: 'acceso',
    resumen: 'Tu firma electrónica: vale como tu firma escrita a mano.',
    queEs: [
      'La e.firma es un conjunto de archivos digitales con tu identidad: un archivo .cer (el certificado), un archivo .key (tu llave privada) y una contraseña propia para usar esa llave. Antes se llamaba FIEL.',
      'Tiene el mismo valor legal que tu firma autógrafa y dura 4 años. Después hay que renovarla.',
    ],
    paraQue: [
      'Firmar declaraciones y trámites que piden más seguridad que la contraseña.',
      'Algunos trámites aceptan contraseña o e.firma; otros exigen e.firma.',
      'Activar o actualizar tu Buzón Tributario.',
    ],
    dondeLoEncuentras: [
      'Se tramita en una oficina del SAT con cita.',
      'Si ya la tienes, busca en tu computadora o USB los archivos .cer y .key.',
    ],
    ojo: 'Guarda tus archivos y su contraseña en un lugar seguro y no los compartas. Revisa la fecha de vencimiento: si se vence, la renovación puede ser más complicada.',
    etiquetas: ['firma electronica', 'fiel', 'cer', 'key', 'certificado', 'firma'],
    relacionadas: ['contrasena', 'buzon-tributario', 'sat-id'],
    tramites: ['efirma', 'declaracion-anual', 'declaraciones-pagos'],
  },
  {
    id: 'sat-id',
    titulo: 'SAT ID',
    categoria: 'acceso',
    resumen: 'Para hacer algunos trámites desde tu celular, sin ir a una oficina.',
    queEs: [
      'SAT ID es un servicio del SAT, con sitio web y app, que te permite hacer ciertos trámites a distancia. Para comprobar que eres tú usas tu identificación oficial y la cámara de tu teléfono.',
    ],
    paraQue: [
      'Generar o renovar tu contraseña.',
      'Renovar tu e.firma, en algunos casos.',
      'Pedir tu Constancia de Situación Fiscal si no tienes contraseña ni e.firma.',
    ],
    dondeLoEncuentras: ['En satid.sat.gob.mx o descargando la app SAT ID.'],
    ojo: 'Pide ser persona física mayor de edad. La respuesta puede tardar algunos días hábiles.',
    etiquetas: ['satid', 'celular', 'app', 'sin cita', 'identificacion'],
    relacionadas: ['contrasena', 'efirma', 'curp'],
    tramites: ['sat-id', 'contrasena-sat', 'efirma', 'constancia-situacion-fiscal'],
  },
  {
    id: 'buzon-tributario',
    titulo: 'Buzón Tributario',
    categoria: 'acceso',
    resumen: 'Tu bandeja de mensajes oficial del SAT.',
    queEs: [
      'Es un buzón dentro del portal del SAT. Ahí el SAT te manda avisos, requerimientos, multas y otras notificaciones.',
      'Una notificación en el buzón se considera entregada aunque no la hayas leído, por eso conviene revisarlo de vez en cuando.',
    ],
    paraQue: [
      'Es obligatorio para la mayoría de los contribuyentes (en algunos casos es opcional).',
      'Para activarlo registras al menos un correo electrónico y un número de celular.',
    ],
    dondeLoEncuentras: ['En el portal del SAT, entrando con tu contraseña o tu e.firma.'],
    ojo: 'Si tributas en RESICO, el SAT dio como plazo hasta el 1 de enero de 2027 para habilitarlo. Confirma tu caso en el sitio del SAT.',
    etiquetas: ['buzon', 'notificaciones', 'mensajes', 'avisos', 'multa'],
    relacionadas: ['contrasena', 'efirma', 'regimen-fiscal'],
    tramites: [],
  },
  {
    id: 'oficina-virtual',
    titulo: 'Oficina Virtual',
    categoria: 'acceso',
    resumen: 'Atención del SAT por videollamada, sin ir a una oficina.',
    queEs: [
      'Es una forma de recibir atención del SAT por videollamada. Se agenda con cita, igual que en una oficina.',
    ],
    paraQue: [
      'Hacer trámites como inscribirte al RFC desde tu casa.',
      'Ahorrarte el traslado y la fila.',
    ],
    dondeLoEncuentras: ['Al agendar tu cita en citas.sat.gob.mx, elige “Oficina Virtual” en lugar de una oficina.'],
    etiquetas: ['videollamada', 'cita virtual', 'atencion a distancia'],
    relacionadas: ['sat-id', 'rfc'],
    tramites: ['cita-sat', 'inscripcion-rfc'],
  },

  // ---------- Documentos y comprobantes ----------
  {
    id: 'constancia-situacion-fiscal',
    titulo: 'Constancia de Situación Fiscal',
    categoria: 'documentos',
    resumen: 'Tu “credencial” fiscal: reúne tus datos ante el SAT.',
    queEs: [
      'Es un documento del SAT que muestra tus datos fiscales: nombre, RFC, domicilio fiscal, régimen y obligaciones. A veces la verás abreviada como CSF.',
    ],
    paraQue: [
      'Bancos, patrones y proveedores la piden para pagarte o facturarte.',
      'Es la forma más rápida de ver tu RFC con homoclave y tu régimen fiscal.',
      'Con ella sabes qué declaraciones tienes pendientes.',
    ],
    dondeLoEncuentras: [
      'Se descarga gratis en el portal del SAT con tu RFC y contraseña.',
      'Sin contraseña, puedes pedirla con SAT ID.',
    ],
    ojo: 'Descárgala de nuevo cuando cambies de domicilio o de régimen: debe mostrar tus datos actuales.',
    etiquetas: ['csf', 'cif', 'cedula de identificacion fiscal', 'constancia', 'datos fiscales'],
    relacionadas: ['rfc', 'regimen-fiscal', 'sat-id'],
    tramites: ['constancia-situacion-fiscal', 'cambio-domicilio', 'sat-id'],
  },
  {
    id: 'cfdi',
    titulo: 'CFDI (factura electrónica)',
    categoria: 'documentos',
    resumen: 'La factura digital que comprueba lo que ganas o gastas.',
    queEs: [
      'CFDI significa Comprobante Fiscal Digital por Internet. Es la factura electrónica de México. Se entrega en dos archivos: un XML (el que cuenta para el SAT) y un PDF (el que puedes leer e imprimir).',
    ],
    paraQue: [
      'Comprobar tus ingresos cuando cobras por un trabajo o un servicio.',
      'Para deducir un gasto personal necesitas que tenga CFDI.',
      'El SAT junta tus facturas y recibos de nómina para precargarlos en tu declaración.',
    ],
    dondeLoEncuentras: [
      'En el correo que te manda quien te factura.',
      'En el visor de comprobantes del SAT, dentro de Declaraciones.',
    ],
    ojo: 'Para que te hagan una factura, pide al comercio: tu nombre, RFC, código postal fiscal y régimen fiscal. Todo eso está en tu Constancia de Situación Fiscal.',
    etiquetas: ['factura', 'xml', 'comprobante', 'recibo de nomina', 'facturar'],
    relacionadas: ['deducciones', 'ingresos', 'constancia-situacion-fiscal'],
    tramites: ['visores', 'declaracion-anual'],
  },
  {
    id: 'acuse',
    titulo: 'Acuse',
    categoria: 'documentos',
    resumen: 'El comprobante de que hiciste un trámite o enviaste una declaración.',
    queEs: [
      'Un acuse es el documento que recibes al terminar un trámite en el portal. Muestra qué hiciste, cuándo lo hiciste y suele traer un número de operación.',
    ],
    paraQue: [
      'Es tu prueba si después hay dudas o aclaraciones.',
      'Algunos trámites lo piden como comprobante de otro trámite.',
    ],
    dondeLoEncuentras: [
      'Al finalizar el trámite, descárgalo en PDF.',
      'Si lo perdiste, hay un trámite para volver a imprimir los acuses del RFC.',
    ],
    ojo: 'Descárgalo y guárdalo apenas termines. Mándate una copia por correo.',
    etiquetas: ['comprobante', 'constancia de envio', 'recibo', 'acuse de recibo'],
    relacionadas: ['declaracion-anual', 'rfc'],
    tramites: ['reimprimir-acuses-rfc', 'declaracion-anual'],
  },
  {
    id: 'opinion-cumplimiento',
    titulo: 'Opinión de cumplimiento (32-D)',
    categoria: 'documentos',
    resumen: 'Dice si estás al corriente con tus obligaciones ante el SAT.',
    queEs: [
      'Es un documento que indica si cumples tus obligaciones fiscales. El resultado puede ser positivo (estás al corriente) o negativo (hay algo pendiente). “32-D” es el artículo del Código Fiscal que la regula.',
    ],
    paraQue: [
      'Algunas empresas o dependencias la piden antes de contratarte o pagarte como proveedor.',
      'Te sirve para saber si tienes declaraciones o pagos pendientes.',
    ],
    dondeLoEncuentras: ['En el portal del SAT, con tu RFC y contraseña o e.firma.'],
    ojo: 'Si sale negativa, revisa tus obligaciones pendientes y ponte al corriente. Un contador te puede orientar.',
    etiquetas: ['32d', '32-d', 'opinion positiva', 'opinion negativa', 'cumplimiento'],
    relacionadas: ['regimen-fiscal', 'constancia-situacion-fiscal'],
    tramites: ['opinion-cumplimiento'],
  },
  {
    id: 'comprobante-domicilio',
    titulo: 'Comprobante de domicilio',
    categoria: 'documentos',
    resumen: 'Un papel reciente que muestra tu nombre y dirección.',
    queEs: [
      'Es un documento que comprueba dónde vives. Los más comunes son el recibo de luz, de agua, de teléfono fijo o el estado de cuenta del banco.',
    ],
    paraQue: [
      'Te lo piden para inscribirte al RFC o para cambiar tu domicilio fiscal.',
      'Debe ser reciente; por lo general, de los últimos 3 meses.',
    ],
    ojo: 'Que el nombre y la dirección se lean completos. Confirma qué documentos acepta tu trámite en su ficha oficial.',
    etiquetas: ['recibo de luz', 'recibo de agua', 'estado de cuenta', 'direccion', 'domicilio fiscal'],
    relacionadas: ['rfc', 'constancia-situacion-fiscal'],
    tramites: ['inscripcion-rfc', 'cambio-domicilio'],
  },

  // ---------- Impuestos y declaraciones ----------
  {
    id: 'isr',
    titulo: 'ISR',
    categoria: 'impuestos',
    resumen: 'El impuesto sobre lo que ganas.',
    queEs: [
      'ISR significa Impuesto Sobre la Renta. Es el impuesto que se paga por los ingresos de una persona: sueldo, honorarios, rentas, intereses, entre otros.',
      'Si trabajas con nómina, tu patrón normalmente lo descuenta de tu pago y lo entrega al SAT.',
    ],
    paraQue: [
      'Es el impuesto que se calcula en tu declaración anual.',
      'En la declaración sale si te retuvieron de más (saldo a favor) o de menos (saldo a cargo).',
    ],
    etiquetas: ['impuesto sobre la renta', 'retencion', 'impuesto', 'nomina'],
    relacionadas: ['declaracion-anual', 'ingresos', 'saldo-a-favor'],
    tramites: ['declaracion-anual', 'declaraciones-pagos'],
  },
  {
    id: 'iva',
    titulo: 'IVA',
    categoria: 'impuestos',
    resumen: 'El impuesto que pagas al comprar casi todo.',
    queEs: [
      'IVA significa Impuesto al Valor Agregado. Lo pagas cuando compras casi cualquier producto o servicio; la tasa general es 16 %.',
      'Si das servicios o vendes con factura, tú cobras el IVA al cliente y después lo entregas al SAT en tus declaraciones.',
    ],
    paraQue: [
      'Te lo cobran en la factura como una línea aparte.',
      'Solo te toca declararlo si tu régimen lo pide; revisa tus obligaciones en tu constancia.',
    ],
    etiquetas: ['impuesto al valor agregado', '16', 'factura', 'iva trasladado'],
    relacionadas: ['cfdi', 'declaracion-mensual', 'regimen-fiscal'],
    tramites: ['declaraciones-pagos'],
  },
  {
    id: 'declaracion-anual',
    titulo: 'Declaración anual',
    categoria: 'impuestos',
    resumen: 'El reporte que haces una vez al año de lo que ganaste y gastaste.',
    queEs: [
      'Es el reporte en el que le cuentas al SAT cuánto ganaste en el año y qué gastos puedes deducir. Con eso se calcula si pagaste de más (te devuelven) o de menos (pagas la diferencia).',
      'Las personas físicas la presentan del 1 al 30 de abril del año siguiente. Se hace en línea, en el portal del SAT.',
    ],
    paraQue: [
      'No todas las personas están obligadas a presentarla: depende de tus ingresos y de tu situación.',
      'Aunque no estés obligado, puede convenirte si tienes saldo a favor.',
    ],
    dondeLoEncuentras: ['En el portal del SAT, en “Declaraciones y pagos personas físicas”, opción “Anual”.'],
    ojo: 'Entra antes de que se acabe abril: en los últimos días el portal suele saturarse.',
    etiquetas: ['anual', 'abril', 'devolucion', 'declarar', 'impuestos'],
    relacionadas: ['ejercicio-fiscal', 'ingresos', 'deducciones', 'saldo-a-favor'],
    tramites: ['declaracion-anual', 'visores'],
  },
  {
    id: 'declaracion-mensual',
    titulo: 'Declaración provisional (mensual)',
    categoria: 'impuestos',
    resumen: 'Pagos de impuestos que adelantas durante el año.',
    queEs: [
      'Algunos regímenes piden pagar impuestos por adelantado, normalmente cada mes. Estas declaraciones se llaman provisionales.',
      'Se presentan a más tardar el día 17 del mes siguiente al que declaras.',
    ],
    paraQue: [
      'Si trabajas solo con sueldo de un patrón, normalmente no las presentas.',
      'Si cobras honorarios, rentas o tienes un negocio, es probable que te toquen.',
    ],
    dondeLoEncuentras: ['En tu Constancia de Situación Fiscal, en “Obligaciones”, ves cuáles te corresponden.'],
    ojo: 'No presentarlas a tiempo puede generar recargos. Si no sabes cuáles te tocan, consulta a un contador.',
    etiquetas: ['mensual', 'provisional', 'pago', 'dia 17', 'obligaciones', 'resico'],
    relacionadas: ['regimen-fiscal', 'iva', 'linea-captura'],
    tramites: ['declaraciones-pagos'],
  },
  {
    id: 'ingresos',
    titulo: 'Ingresos',
    categoria: 'impuestos',
    resumen: 'Todo el dinero que recibes por tu trabajo o tus bienes.',
    queEs: [
      'Para el SAT, tus ingresos son el dinero que recibes: sueldos, honorarios, rentas, intereses del banco y venta de bienes, entre otros.',
    ],
    paraQue: [
      'Son la base para calcular tu impuesto en la declaración.',
      'Tener tus cifras ordenadas antes de declarar evita errores.',
    ],
    dondeLoEncuentras: [
      'Constancia de sueldos que te da tu patrón.',
      'Tus recibos de nómina y facturas en el visor del SAT.',
      'Tus estados de cuenta del banco, para los intereses.',
    ],
    etiquetas: ['sueldo', 'honorarios', 'rentas', 'intereses', 'ganancias', 'dinero'],
    relacionadas: ['isr', 'deducciones', 'cfdi'],
    tramites: ['declaracion-anual', 'visores'],
  },
  {
    id: 'deducciones',
    titulo: 'Deducciones personales',
    categoria: 'impuestos',
    resumen: 'Gastos que puedes restar de tus ingresos para pagar menos impuesto.',
    queEs: [
      'La ley permite restar ciertos gastos personales de tus ingresos antes de calcular el impuesto. Por ejemplo: honorarios médicos y dentales, gastos funerales, intereses de un crédito hipotecario, colegiaturas con límites, donativos y primas de seguros de gastos médicos.',
    ],
    paraQue: [
      'Mientras más deducciones válidas tengas, menor puede ser tu impuesto.',
      'Para que cuenten, deben estar pagados en ese año y tener factura (CFDI).',
      'En general se pagan con tarjeta, transferencia o cheque, no en efectivo, con algunas excepciones.',
    ],
    dondeLoEncuentras: ['El visor de deducciones personales del SAT junta las facturas que te hicieron.'],
    ojo: 'Muchas deducciones tienen límites. Confirma los montos vigentes en el portal del SAT.',
    etiquetas: ['gastos medicos', 'colegiaturas', 'donativos', 'hipotecario', 'restar', 'deducir'],
    relacionadas: ['cfdi', 'ingresos', 'declaracion-anual'],
    tramites: ['visores', 'declaracion-anual'],
  },
  {
    id: 'saldo-a-favor',
    titulo: 'Saldo a favor y saldo a cargo',
    categoria: 'impuestos',
    resumen: 'Si pagaste de más te devuelven; si pagaste de menos, pagas la diferencia.',
    queEs: [
      'Al terminar tu declaración anual, el SAT calcula la diferencia entre lo que pagaste durante el año y lo que te correspondía pagar.',
      'Saldo a favor: pagaste de más. Puedes pedir la devolución y el SAT la deposita en tu cuenta bancaria. Saldo a cargo: pagaste de menos. Debes pagar la diferencia.',
    ],
    paraQue: [
      'Para la devolución necesitas una cuenta bancaria a tu nombre y su CLABE.',
      'Si te sale saldo a cargo, el portal te da una línea de captura para pagar.',
    ],
    etiquetas: ['devolucion', 'saldo', 'me devuelven', 'pagar', 'diferencia'],
    relacionadas: ['clabe', 'linea-captura', 'declaracion-anual'],
    tramites: ['declaracion-anual'],
  },
  {
    id: 'clabe',
    titulo: 'CLABE interbancaria',
    categoria: 'impuestos',
    resumen: 'Los 18 números que identifican tu cuenta para recibir depósitos.',
    queEs: [
      'La CLABE tiene 18 dígitos. Sirve para que te depositen directo a tu cuenta bancaria desde otro banco.',
      'El SAT la pide cuando tienes saldo a favor, para depositarte la devolución.',
    ],
    paraQue: [
      'La cuenta debe estar a tu nombre.',
      'Tenerla a la mano antes de declarar te ahorra tiempo.',
    ],
    dondeLoEncuentras: ['En la app o el estado de cuenta de tu banco, o preguntando en una sucursal.'],
    ojo: 'No es el número de tu tarjeta (que tiene 16 dígitos). Cópiala completa y revísala dos veces.',
    etiquetas: ['cuenta', 'banco', 'deposito', 'transferencia', '18 digitos', 'devolucion'],
    relacionadas: ['saldo-a-favor', 'declaracion-anual'],
    tramites: ['declaracion-anual'],
  },
  {
    id: 'linea-captura',
    titulo: 'Línea de captura',
    categoria: 'impuestos',
    resumen: 'El código con el que pagas un impuesto en el banco o en línea.',
    queEs: [
      'Es una clave que genera el portal del SAT cuando debes pagar algo. Trae el monto exacto y la referencia que el banco necesita para aplicar tu pago.',
    ],
    paraQue: [
      'Pagar un saldo a cargo o una declaración con pago.',
      'Se puede pagar desde la banca en línea o en ventanilla, según el banco.',
    ],
    ojo: 'Tiene fecha límite. Si pagas después, puede dejar de ser válida y tendrías que generar otra.',
    etiquetas: ['pago', 'banco', 'referencia', 'saldo a cargo', 'pagar impuestos', 'recargos'],
    relacionadas: ['saldo-a-favor', 'declaracion-mensual'],
    tramites: ['declaraciones-pagos', 'declaracion-anual'],
  },
];

export function buscarGuia(id: string): Guia | undefined {
  return GUIAS.find((g) => g.id === id);
}

/** Guias en las que se menciona un tramite (para mostrarlas dentro de la ficha del tramite). */
export function guiasDeTramite(tramiteId: string): Guia[] {
  return GUIAS.filter((g) => g.tramites.includes(tramiteId));
}

/** Guias relacionadas con una guia, en el orden en que se declararon (ignora ids que no existan). */
export function guiasRelacionadas(guia: Guia): Guia[] {
  return guia.relacionadas.map(buscarGuia).filter((g): g is Guia => g !== undefined);
}

/** Filtra por categoria y por texto (sin acentos ni mayusculas) en titulo, resumen y etiquetas. */
export function filtrarGuias(
  lista: readonly Guia[],
  texto: string,
  categoria: CategoriaGuiaId | 'todas',
): Guia[] {
  const q = normalizarBusqueda(texto);
  return lista.filter((g) => {
    if (categoria !== 'todas' && g.categoria !== categoria) return false;
    if (!q) return true;
    const pajar = normalizarBusqueda([g.titulo, g.resumen, ...g.etiquetas].join(' '));
    return q.split(/\s+/).every((palabra) => pajar.includes(palabra));
  });
}

import { LONGITUD_CODIGO } from './codigo';

/** Todos los mensajes de error visibles para el usuario, en un solo lugar. */

export const MSG = {
  correo: {
    obligatorio: 'El correo electrónico es obligatorio.',
    invalido: 'Ingresa un correo válido.',
  },
  password: {
    obligatoria: 'La contraseña es obligatoria.',
    muyCorta: 'La contraseña debe tener al menos 8 caracteres.',
    muyLarga: 'La contraseña no puede tener más de 72 caracteres.',
    igualAlCorreo: 'La contraseña no puede ser igual al correo.',
    actualObligatoria: 'Escribe tu contraseña actual.',
    igualALaActual: 'La nueva contraseña debe ser distinta de la actual.',
  },
  confirmPassword: {
    obligatoria: 'Confirma tu contraseña.',
    noCoincide: 'Las contraseñas no coinciden.',
  },
  nombre: {
    obligatorio: 'El nombre es obligatorio.',
    invalido: 'El nombre solo puede incluir letras, espacios, apóstrofes y guiones.',
    muyLargo: 'El nombre no puede tener más de 60 caracteres.',
  },
  apellidoPaterno: {
    obligatorio: 'El apellido paterno es obligatorio.',
    invalido: 'El apellido solo puede incluir letras, espacios, apóstrofes y guiones.',
    muyLargo: 'El apellido no puede tener más de 60 caracteres.',
  },
  apellidoMaterno: {
    invalido: 'El apellido solo puede incluir letras, espacios, apóstrofes y guiones.',
    muyLargo: 'El apellido no puede tener más de 60 caracteres.',
  },
  nacimiento: {
    obligatoria: 'La fecha de nacimiento es obligatoria.',
    invalida: 'Ingresa una fecha de nacimiento válida.',
    futura: 'La fecha de nacimiento no puede ser futura.',
    menorDeEdad: 'Debes tener al menos 18 años para registrarte.',
  },
  rfc: {
    obligatorio: 'El RFC es obligatorio.',
    longitud: 'El RFC de persona física debe tener 13 caracteres.',
    formato: 'El formato del RFC no es válido.',
    generico: 'Ingresa tu RFC personal, no un RFC genérico.',
    digitoVerificador: 'El RFC no es válido. Revisa que esté bien escrito.',
    noCoincideConNacimiento: 'La fecha del RFC no coincide con tu fecha de nacimiento.',
  },
  domicilio: {
    calle: 'La calle es obligatoria.',
    numExt: 'El número exterior es obligatorio.',
    colonia: 'La colonia es obligatoria.',
    cpObligatorio: 'El código postal es obligatorio.',
    cpInvalido: 'El código postal debe tener 5 dígitos.',
    municipio: 'El municipio es obligatorio.',
    estado: 'El estado es obligatorio.',
    muyLargo: 'Este campo es demasiado largo.',
  },
  perfil: {
    soloLectura: 'Estos datos no se pueden cambiar desde la app. Se toman del registro de tu cuenta.',
    domicilioAviso:
      'Este es el domicilio de tu perfil en la app. Cambiarlo aquí no lo actualiza ante el SAT: eso se hace en el portal.',
    domicilioGuardado: 'Domicilio actualizado.',
    sinCambios: 'No hiciste cambios en tu domicilio.',
    contrasenaActualizada: 'Contraseña actualizada.',
    contrasenaAviso:
      'Por seguridad, escribe tu contraseña actual. Al cambiarla se cerrará tu sesión en otros dispositivos.',
  },
  privacidad: {
    obligatoria: 'Debes aceptar el aviso de privacidad y los términos.',
  },
  codigo: {
    obligatorio: 'Ingresa el código que enviamos a tu correo.',
    formato: `El código debe tener ${LONGITUD_CODIGO} dígitos.`,
  },
  recordatorio: {
    titulo: {
      obligatorio: 'El título es obligatorio.',
      muyLargo: 'El título no puede tener más de 80 caracteres.',
    },
    hora: {
      obligatoria: 'La hora es obligatoria.',
      invalida: 'Ingresa una hora válida, de 00:00 a 23:59.',
      pasada: 'Esa hora ya pasó. Elige una hora futura.',
    },
    fechaPasada: 'No se pueden agendar recordatorios en fechas pasadas.',
    notificacionesNoDisponibles:
      'Recordatorio guardado.',
  },
  documento: {
    nombre: {
      obligatorio: 'El nombre es obligatorio.',
      muyLargo: 'El nombre no puede tener más de 80 caracteres.',
    },
    lectura: {
      boton: 'Leer montos y fechas del documento',
      leyendo: 'Leyendo el documento…',
      aviso:
        'La lectura es automática y puede equivocarse. Compara cada dato con tu documento antes de usarlo; debajo de cada uno ves el renglón de donde se leyó. El documento se lee en tu teléfono y no se envía a ningún servicio.',
      sinCantidades: 'No encontramos montos ni fechas. Prueba con una foto más nítida, de frente, sin sombras y con buena luz.',
      soloOtros: 'No encontramos montos de dinero ni fechas, solo otros números. Puedes verlos con el botón de abajo.',
      error: 'No pudimos leer el documento. Inténtalo de nuevo con una foto más nítida.',
      sinMontos: 'No encontramos montos de dinero en este documento.',
      noDisponible: 'Tu teléfono no permite leer montos y fechas de documentos en esta versión de la app.',
    },
  },
  camara: {
    sinPermiso:
      'Necesitamos permiso para usar la cámara. Actívalo en los ajustes del teléfono.',
    sinPermisoReintentar: 'Sin permiso no podemos usar la cámara. Toca «Tomar foto» para intentarlo de nuevo.',
    noSeAbrio: 'No pudimos abrir la cámara. Inténtalo de nuevo.',
  },
  tramites: {
    aviso:
      'Esta app prepara tus datos y te lleva al sitio oficial del SAT. No envía nada al SAT ni te pide tu contraseña o e.firma: el trámite lo haces tú.',
    confirmar: 'Los requisitos pueden cambiar. Confirma siempre en la ficha oficial del trámite.',
    enlaceNoSeguro: 'Por seguridad, solo abrimos direcciones oficiales del SAT.',
    noSeAbrio: 'No pudimos abrir el enlace. Inténtalo de nuevo.',
    sinResultados: 'No encontramos trámites con esa búsqueda.',
    sinPerfil: 'No encontramos tus datos guardados.',
  },
  documentosDelTramite: {
    titulo: 'Tus documentos',
    ayuda:
      'Abre la lista, elige un documento y copia sus montos sin salir del trámite. Se lee en tu teléfono, sin enviarlo a ningún servicio.',
    vacio: 'Aún no tienes documentos guardados. Agrega uno para tener sus montos a la mano.',
    agregar: 'Agregar un documento',
    verDocumento: 'Abrir documento completo',
    leyendo: 'Leyendo el documento…',
  },
  guias: {
    intro: 'Explicaciones sencillas de las palabras que vas a ver en tus trámites. Toca una para leerla.',
    sinResultados: 'No encontramos ese término. Prueba con otra palabra, por ejemplo “RFC” o “factura”.',
    aviso:
      'Esta guía es informativa y puede cambiar. No sustituye la asesoría de un contador. Confirma siempre en el sitio oficial del SAT.',
  },
  dinero: {
    aviso:
      'Tus datos de dinero se guardan en tu cuenta y solo tú puedes verlos. La app no calcula tu impuesto ni envía nada al SAT: organiza tus cifras para que las copies al portal sin equivocarte.',
    guardado: 'Datos guardados. Ya puedes copiarlos en la pestaña Copiar.',
    guardadoLocal:
      'Guardado en tu teléfono. Se enviará a tu cuenta cuando haya conexión. Ya puedes copiarlo en la pestaña Copiar.',
    restaurado: 'Recuperamos lo que estabas escribiendo y aún no habías guardado.',
    pendiente: 'Tienes cambios guardados solo en este teléfono. Se enviarán a tu cuenta cuando haya conexión.',
    sinConexion: 'Sin conexión. Puedes llenar y guardar el formulario: se guarda en tu teléfono y se envía después.',
    sinEnviar:
      'Tienes datos que solo están en este teléfono y aún no llegan a tu cuenta. Si cierras sesión se perderán.',
    sinDatos: 'Aún no hay datos guardados. Llena el formulario y pulsa Guardar.',
    pesosEnteros: 'Si el portal pide pesos enteros, redondea el monto al copiarlo.',
    mensualesNota:
      'Es la suma de lo que guardaste en tus declaraciones mensuales. Se usa para llenar tu declaración anual, donde solo tendrás que hacer ajustes.',
    anualVacioMensuales:
      'Si presentas declaraciones mensuales, captúralas en «Declaración mensual»: aquí se sumarán para llenar tu declaración anual y solo tendrás que ajustar.',
    anualLlenado:
      'Llenamos tu declaración anual con la suma de tus declaraciones mensuales. Revisa y ajusta lo que haga falta, y pulsa Guardar.',
    anualSinConexion: 'Sin conexión: la suma usa lo guardado en este teléfono y podría faltar algún mes.',
  },
} as const;

/** Errores del servicio de autenticacion (ver src/services/auth.ts). */
export const AUTH_MESSAGES = {
  EMAIL_TAKEN: 'Este correo ya está vinculado a otra cuenta.',
  RFC_TAKEN: 'Este RFC ya está registrado.',
  PROFILE_REJECTED: 'No pudimos crear tu cuenta. Revisa tus datos e inténtalo de nuevo.',
  INVALID_CREDENTIALS: 'Correo o contraseña incorrectos.',
  CURRENT_PASSWORD_WRONG: 'La contraseña actual no es correcta.',
  SAME_PASSWORD: 'La nueva contraseña debe ser distinta de la actual.',
  WEAK_PASSWORD: 'Esa contraseña es muy fácil de adivinar. Elige otra más segura.',
  EMAIL_NOT_VERIFIED: 'Debes confirmar tu correo para continuar.',
  CODE_INVALID: 'El código es incorrecto o ya venció. Solicita uno nuevo.',
  RATE_LIMITED: 'Demasiados intentos. Espera un momento e inténtalo de nuevo.',
  NETWORK: 'No hay conexión. Revisa tu internet e inténtalo de nuevo.',
  UNKNOWN: 'Ocurrió un error inesperado. Inténtalo de nuevo.',
} as const;

export type AuthErrorCode = keyof typeof AUTH_MESSAGES;

/** Errores del servicio de recordatorios (ver src/services/recordatorios.ts). */
export const RECORDATORIO_MESSAGES = {
  NETWORK: 'No hay conexión. Revisa tu internet e inténtalo de nuevo.',
  FECHA_PASADA: 'La fecha o la hora ya pasó. Elige una futura.',
  UNKNOWN: 'Ocurrió un error inesperado. Inténtalo de nuevo.',
} as const;

export type RecordatorioErrorCode = keyof typeof RECORDATORIO_MESSAGES;

/** Errores del servicio de documentos (ver src/services/documentos.ts). */
export const DOCUMENTO_MESSAGES = {
  NETWORK: 'No hay conexión. Revisa tu internet e inténtalo de nuevo.',
  TOO_LARGE: 'La imagen es demasiado grande (máximo 5 MB).',
  NOT_FOUND: 'No encontramos este documento. Puede que ya se haya eliminado.',
  UNKNOWN: 'Ocurrió un error inesperado. Inténtalo de nuevo.',
} as const;

export type DocumentoErrorCode = keyof typeof DOCUMENTO_MESSAGES;

/** Errores del servicio de perfil (ver src/services/perfil.ts). */
export const PERFIL_MESSAGES = {
  NETWORK: 'No hay conexión. Revisa tu internet e inténtalo de nuevo.',
  UNKNOWN: 'No pudimos cargar tus datos. Inténtalo de nuevo.',
  GUARDAR: 'No pudimos guardar los cambios. Revisa tus datos e inténtalo de nuevo.',
} as const;

export type PerfilErrorCode = keyof typeof PERFIL_MESSAGES;

/** Errores del servicio de datos de dinero (ver src/services/datosDinero.ts). */
export const DINERO_MESSAGES = {
  NETWORK: 'No hay conexión. Revisa tu internet e inténtalo de nuevo.',
  UNKNOWN: 'No pudimos completar la operación. Inténtalo de nuevo.',
} as const;

export type DineroErrorCode = keyof typeof DINERO_MESSAGES;

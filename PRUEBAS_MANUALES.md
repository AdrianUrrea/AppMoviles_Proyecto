# Pruebas manuales (en el teléfono o emulador)

Estas pruebas no se pueden automatizar aquí; son las que verifican los criterios de aceptación.
Marca cada una. Si alguna falla, anota qué pantalla mostró y copia la línea `[auth:...]` de la terminal.

## Registro y confirmación (criterios 1 a 5)
- [ ] En el login, "Crear cuenta" abre el formulario.
- [ ] Enviar el formulario vacío marca todos los campos obligatorios en rojo.
- [ ] Contraseña de 7 caracteres → "al menos 8 caracteres". Confirmación distinta → "no coinciden".
- [ ] RFC con la fecha distinta a la de nacimiento → "no coincide con tu fecha de nacimiento".
- [ ] Menor de 18 años → mensaje de edad mínima.
- [ ] Registro correcto → llega el correo con el código y se abre la pantalla de confirmación.
- [ ] Código incorrecto → error y se puede reintentar. "Reenviar código" espera 60 s.
- [ ] Código correcto → entra al dashboard y muestra "Hola, {tu nombre}".
- [ ] Registrar un correo ya verificado → "Este correo ya está vinculado a otra cuenta."
- [ ] Registrar un RFC ya verificado con otro correo → "Este RFC ya está registrado."

## Login (criterios 6 a 8)
- [ ] Correo y contraseña correctos → dashboard.
- [ ] Contraseña incorrecta Y correo inexistente → el MISMO mensaje: "Correo o contraseña incorrectos."
- [ ] Cuenta sin confirmar + contraseña correcta → pantalla de confirmación (y llega un código nuevo).

## Sesión y navegación (criterios 9 a 11; tareas 18 y 19)
- [ ] Con sesión abierta, cerrar la app por completo y reabrirla → entra directo al dashboard.
- [ ] Cerrar sesión → login. Botón "atrás" de Android desde ahí → sale de la app, NO vuelve al dashboard.
- [ ] Desde el dashboard, botón "atrás" de Android → sale de la app, NO vuelve al login.
- [ ] Registrarse y, SIN confirmar, cerrar la app por completo y reabrirla → vuelve a la pantalla de confirmación (con el reenvío disponible de inmediato).
- [ ] En esa pantalla, "Volver al inicio de sesión", cerrar y reabrir la app → ahora abre el login.

## Errores de red y doble envío (tarea 20)
- [ ] Activar modo avión y pulsar "Crear cuenta" → mensaje "No hay conexión…" y lo escrito se conserva.
- [ ] Desactivar modo avión y reintentar → funciona sin volver a llenar el formulario.
- [ ] Tocar "Crear cuenta" varias veces seguidas → solo llega UN correo.

## Pendiente de verificar con una prueba real
- [ ] Registrarse, no confirmar, y volver a registrarse con el MISMO correo y RFC pero cambiando, por
      ejemplo, el domicilio. Confirmar y revisar en Supabase (Table Editor → usuario) con qué datos quedó el perfil.

---

# Dashboard (nuevo)

## Tarjetas y navegacion
- [ ] El dashboard muestra "Hola, {tu nombre}", tu correo y cinco tarjetas: Documentos, Calendario, Guias, Mi perfil y Configuracion.
- [ ] Las cuatro primeras van en dos columnas; Configuracion ocupa todo el ancho.
- [ ] Tocar cada tarjeta abre su pantalla con el titulo correcto en el encabezado (Guias incluida: "Proximamente").
- [ ] El boton "atras" (del encabezado y el de Android) regresa al dashboard.
- [ ] Desde el dashboard, "atras" de Android sale de la app (no vuelve al login).
- [ ] Tocar una tarjeta dos veces rapido abre la pantalla UNA sola vez (un solo "atras" regresa al dashboard).

## Configuracion y sesion
- [ ] "Cerrar sesion" esta en Configuracion y lleva al login. Ya no hay boton de cerrar sesion en el dashboard.
- [ ] "Cambiar contrasena" aparece atenuada con "Proximamente" y no hace nada al tocarla.

## Errores y casos limite
- [ ] Con modo avion, abrir la app con sesion: aparece "No pudimos cargar tu perfil." y el boton "Reintentar".
- [ ] Quitar el modo avion y tocar "Reintentar": aparece tu nombre y desaparece el aviso. Las tarjetas funcionan en todo momento.
- [ ] Con el texto del sistema al maximo (Ajustes > Accesibilidad > Tamano de fuente): las tarjetas crecen y no cortan el texto.
- [ ] Con un nombre muy largo (editarlo en Supabase para la prueba): el saludo se recorta con "..." sin romper el diseno.
- [ ] Pantalla pequena / emulador chico: todo se ve completo y se puede hacer scroll.

## Base de datos (SQL 003)
- [ ] Despues de ejecutar 003, en Supabase intenta editar tu nombre desde la app con la API (o solo confirma que
      ejecuto sin errores). El domicilio seguira siendo editable cuando se construya "Mi perfil".

---

# Calendario y recordatorios (nuevo)

IMPORTANTE: probar en un telefono FISICO. Las notificaciones no se pueden verificar en un emulador de forma fiable.
Antes: ejecutar supabase/004_recordatorio.sql y reiniciar con `npx expo start -c`.

## Calendario
- [ ] Calendario > se ve el mes actual en espanol (meses y dias), con el dia de hoy resaltado.
- [ ] Se puede cambiar de mes con las flechas y deslizando.
- [ ] Tocar un dia abre "Recordatorios" con la fecha larga ("Viernes 23 de octubre de 2026").
- [ ] Tocar un dia dos veces rapido abre la pantalla UNA sola vez.

## Agendar
- [ ] En un dia futuro: escribir titulo y hora (ej. 14:30) y pulsar "Agendar recordatorio".
- [ ] La primera vez, el telefono pide permiso de notificaciones. Aceptar.
- [ ] Llega AL INSTANTE una notificacion "Recordatorio agendado" con el titulo y la fecha.
- [ ] El recordatorio aparece en la lista del dia, con su hora, y el formulario queda vacio (tambien la hora).
- [ ] Volver al calendario: el dia muestra un punto.
- [ ] Agendar dos recordatorios el mismo dia: ambos aparecen ordenados por hora y hay un solo punto.
- [ ] Prueba del aviso real: agendar para HOY, 2 o 3 minutos adelante. Cerrar la app por completo y esperar.
      Debe llegar la notificacion "Recordatorio" con el titulo, a esa hora (puede variar uno o dos minutos en algunos Android).
- [ ] Tocar esa notificacion abre la app en el dia del recordatorio.

## Validaciones
- [ ] Titulo vacio -> "El titulo es obligatorio." Hora vacia -> "La hora es obligatoria."
- [ ] Hora 25:00 o 12:60 -> "Ingresa una hora valida, de 00:00 a 23:59."
- [ ] Hoy con una hora que ya paso -> "Esa hora ya paso. Elige una hora futura."
- [ ] Un dia pasado: se ve el detalle pero NO el formulario, con el mensaje de fechas pasadas.

## Eliminar
- [ ] "Eliminar" pide confirmacion. "Cancelar" no borra nada.
- [ ] Confirmar elimina el recordatorio; si era el unico del dia, el punto desaparece del calendario.
- [ ] Prueba clave: agendar un recordatorio para dentro de 2-3 minutos, ELIMINARLO, y esperar: NO debe llegar notificacion.

## Permiso y errores
- [ ] Negar el permiso de notificaciones: el recordatorio se guarda y aparece el aviso con "Abrir ajustes del telefono".
- [ ] Modo avion al pulsar "Agendar recordatorio": mensaje de falta de conexion y lo escrito se conserva.
- [ ] Modo avion al eliminar: mensaje de error y el recordatorio sigue en la lista.
- [ ] Pulsar "Agendar recordatorio" varias veces seguidas: se crea UN solo recordatorio y llega UNA confirmacion.

## Sesion y varios dispositivos
- [ ] Cerrar sesion y agendar-esperar: con la sesion cerrada NO debe llegar el aviso de un recordatorio anterior.
- [ ] Volver a iniciar sesion: los recordatorios futuros siguen ahi y sus avisos se reprograman (probar con uno a 2-3 minutos).
- [ ] (Si tienes dos telefonos) Eliminar un recordatorio en uno; abrir la app en el otro: su aviso ya no debe llegar.

## Pendiente de verificar en tu telefono
- [ ] En Expo Go de Android puede aparecer un aviso de que las notificaciones PUSH remotas no estan disponibles.
      Es esperado: esta funcion usa notificaciones locales. Si aparece otro error distinto, copialo.

---

# Documentos con camara (nuevo)

IMPORTANTE: probar en un telefono FISICO. En un emulador la camara es simulada.
Antes: ejecutar supabase/005_documentos.sql y reiniciar con `npx expo start -c`.

## Tomar y guardar
- [ ] Documentos > "Tomar foto": el telefono pide permiso de camara la primera vez. Aceptar.
- [ ] Se abre la camara del sistema. Tomar la foto y aceptarla.
- [ ] Aparece "Nuevo documento" con la vista previa y el nombre sugerido ("Documento 24 oct 2026").
- [ ] Cambiar el nombre y pulsar "Guardar documento": regresa a la lista y el documento aparece primero, con miniatura, fecha y tamano.
- [ ] El tamano mostrado es de unos cientos de KB (no varios MB): la foto se comprime antes de subir.
- [ ] "De la galeria" funciona igual con una foto existente.
- [ ] Una foto tomada en VERTICAL se ve vertical (no girada) en la vista previa, la miniatura y el detalle.

## Ver y eliminar
- [ ] Tocar un documento abre el detalle con la imagen completa, el nombre, la fecha y el tamano.
- [ ] "Eliminar documento" pide confirmacion. "Cancelar" no borra nada.
- [ ] Confirmar elimina el documento y regresa a la lista sin el.
- [ ] En Supabase > Storage > documentos > (tu carpeta): el archivo ya no existe tras eliminar.

## Validaciones y errores
- [ ] Nombre vacio -> "El nombre es obligatorio." Nombre de mas de 80 caracteres -> error.
- [ ] Cancelar la camara (atras) no muestra ningun error y no cambia nada.
- [ ] Negar el permiso de camara: aparece el mensaje y, si lo negaste de forma definitiva, el boton "Abrir ajustes del telefono".
- [ ] Modo avion al pulsar "Guardar documento": mensaje de falta de conexion y la foto y el nombre se conservan.
- [ ] Quitar el modo avion y volver a pulsar "Guardar documento": se guarda sin tomar la foto otra vez.
- [ ] Pulsar "Guardar documento" varias veces seguidas: se crea UN solo documento.
- [ ] "Descartar" regresa a la lista sin guardar nada.

## Privacidad (importante)
- [ ] En Supabase > Storage, el bucket "documentos" aparece como PRIVADO (no "public").
- [ ] Copiar el enlace de imagen de un documento, esperar mas de 1 hora y abrirlo en el navegador: ya no debe funcionar.
- [ ] Con DOS cuentas: la cuenta B NO ve los documentos de la cuenta A.

## Android
- [ ] Con poca memoria (varias apps abiertas), tomar una foto: al volver de la camara la app sigue en la foto tomada
      (o, si Android cerro la app, recupera la foto al reabrir Documentos). Si la foto se pierde, avisame con el modelo del telefono.

---

# Tramites SAT (nuevo)

Antes: `npx expo install expo-clipboard` y reiniciar con `npx expo start -c`. No requiere SQL nuevo.

## Dashboard y lista
- [ ] El dashboard muestra la tarjeta "Tramites SAT" ARRIBA, a todo lo ancho; debajo, cuatro tarjetas en dos columnas, y Configuracion abajo.
- [ ] La lista muestra 11 tramites, con el aviso de que la app no envia nada al SAT.
- [ ] Buscar "contrasena" encuentra "Contraseña del SAT" (sin acento). Buscar "32-d" encuentra la opinion de cumplimiento.
- [ ] Los botones de categoria filtran la lista. Una busqueda sin resultados muestra el mensaje.
- [ ] Tocar un tramite dos veces rapido lo abre UNA sola vez.

## Detalle de un tramite
- [ ] Se ven: como ingresas, que necesitas (casillas), pasos en el portal, tus datos, notas y los botones de enlace.
- [ ] Las casillas de "Que necesitas" se pueden marcar. (Al salir y volver se reinician: es lo esperado por ahora.)
- [ ] "Tus datos" muestra TUS datos reales (RFC, nombre, domicilio...). La fecha sale como DD/MM/AAAA.
- [ ] Tocar un dato lo copia (aparece "Copiado"). Pegarlo en otra app (notas, mensajes) para comprobarlo.
- [ ] Un tramite sin numero interior NO muestra la fila "Numero interior" vacia.
- [ ] Con modo avion: en "Tus datos" aparece el error con "Reintentar"; al quitarlo y pulsar Reintentar, aparecen los datos.

## Enlaces (lo mas importante: verificalo tu)
- [ ] Prueba CADA boton "Abrir: ...". Debe abrir el navegador en un sitio de sat.gob.mx.
- [ ] Anota cualquier enlace que no abra o que lleve a una pagina que ya no existe, y dime cual.
- [ ] Revisa que los pasos/rutas de menu coincidan con lo que ves hoy en el portal del SAT. Los portales cambian.

## Lo que NO debe pasar
- [ ] La app NUNCA pide contrasena, e.firma ni CIEC en ninguna pantalla.
- [ ] Ningun boton envia datos a un sitio que no sea del SAT.

---

# Datos de dinero (nuevo)

Antes: ejecutar supabase/006_captura_financiera.sql (Supabase > SQL Editor) y reiniciar con `npx expo start -c`.
No requiere librerias nuevas (usa expo-clipboard, que ya instalaste para Tramites SAT).

## Entrada
- [ ] En Tramites SAT aparece la tarjeta "Mis datos de dinero" arriba. Abre un centro con 3 opciones: Declaracion anual, Declaracion mensual y Cuenta para devolucion.
- [ ] En el detalle de "Declaracion anual" aparecen los botones "Capturar y copiar: Declaracion anual" y "...Cuenta para devolucion". En "Otras declaraciones y pagos", el de la declaracion mensual.

## Declaracion anual
- [ ] Se ven los ejercicios (ultimos 5) como botones; el primero es el año anterior.
- [ ] Las secciones aparecen en orden: Ingresos -> ISR retenido y pagos -> Deducciones personales (9 conceptos).
- [ ] Escribir "$120,000.00" en un ingreso y guardar: queda como 120000. Escribir "doce mil" -> error de monto valido. Escribir "12,5" -> error.
- [ ] Mientras escribes, el recuadro verde muestra los totales (ingresos y deducciones) y se actualiza al instante.
- [ ] Pulsar Guardar: aparece "Datos guardados" y abajo la "Lista para copiar" con SOLO los campos que llenaste, en orden.
- [ ] Tocar un dato lo copia, se marca "Copiado" y arriba sube el contador ("2 de 5 copiados"). Pegarlo en otra app: debe salir sin $ ni comas.
- [ ] Cambiar de ejercicio muestra los datos de ESE ejercicio (vacios si no hay). Volver al anterior recupera lo guardado.
- [ ] Salir de la app por completo y volver: los datos siguen ahi.

## Declaracion mensual
- [ ] Se ven los ultimos 12 meses (p. ej. "Noviembre 2026"). Captura ingresos y gastos: la "Referencia" (ingresos menos gastos) se calcula y puede salir NEGATIVA (con signo menos).

## Cuenta para devolucion
- [ ] Guardar sin CLABE -> "Este campo es obligatorio".
- [ ] Una CLABE de 17 digitos -> "debe tener 18 digitos". Una con un digito cambiado -> "no es valida".
- [ ] Una CLABE correcta (para probar: 002010077777777771, que es un ejemplo, no una cuenta real) se guarda.
- [ ] En la lista se ve OCULTA (••••••••••••••7771), pero al pegarla sale COMPLETA.

## Errores y privacidad
- [ ] Modo avion al pulsar Guardar: mensaje de falta de conexion y lo escrito NO se pierde.
- [ ] Modo avion al abrir una pantalla: aparece el error con "Reintentar".
- [ ] Con DOS cuentas: la cuenta B NO ve los datos de dinero de la cuenta A.
- [ ] En Supabase > Table Editor > captura_financiera hay UNA fila por ejercicio/mes/cuenta (guardar dos veces el mismo ejercicio no crea una segunda fila).

## Lo que NO debe pasar
- [ ] La app NUNCA calcula ni muestra "tu impuesto a pagar": solo sumas de lo que tu escribiste.
- [ ] Ningun boton abre el portal con datos incluidos en la direccion.

---

# Modo sin conexion de "Datos de dinero" (nuevo)

Probar en un telefono FISICO. Para simular: modo avion. No hace falta ejecutar SQL nuevo.

## Llenar sin conexion
- [ ] Con modo avion, Trámites > Mis datos de dinero > Declaración anual: el formulario abre (sin spinner infinito) y aparece "Sin conexión...".
- [ ] Llenar varios montos y pulsar Guardar: mensaje "Guardado en tu teléfono..." y aparece el aviso "Tienes cambios guardados solo en este teléfono".
- [ ] Los datos guardados aparecen en "Lista para copiar" y se pueden copiar sin conexión.
- [ ] Quitar el modo avion y esperar (hasta ~1 minuto) o salir y volver a la app: el aviso de pendiente desaparece.
- [ ] En Supabase > Table Editor > captura_financiera aparece la fila con esos datos.

## Borrador: la app se cierra a medias
- [ ] Escribir algo en 2 o 3 campos SIN pulsar Guardar. Esperar 1 segundo. Cerrar la app por completo (quitarla de recientes) y reabrir.
- [ ] Abrir el mismo formulario: los campos estan como se dejaron y aparece "Recuperamos lo que estabas escribiendo".
- [ ] Escribir un texto invalido (por ejemplo 12abc en un monto), cerrar la app y reabrir: el texto sigue ahi (Guardar lo marcara como error).
- [ ] Escribir, y mandar la app a segundo plano INMEDIATAMENTE (menos de medio segundo): al volver, lo escrito sigue.
- [ ] Escribir en el periodo 2023 (no el mas reciente), cerrar y reabrir: la pantalla abre en 2023 y el periodo tiene un punto (•).
- [ ] Guardar y luego salir de la pantalla: al volver NO aparece "Recuperamos lo que estabas escribiendo".

## Conflictos y sesion
- [ ] Guardar sin conexion, guardar otra vez con otro valor (sigue sin conexion), recuperar conexion: en Supabase queda el ULTIMO valor.
- [ ] Guardar sin conexion y cerrar sesion SIN conexion: aparece "Cambios sin enviar" y Cancelar no cierra la sesion.
- [ ] Con conexion, guardar y cerrar sesion: cierra sin avisos. Iniciar sesion con OTRA cuenta: no ve borradores ni pendientes de la primera.
- [ ] Con conexion, abrir un formulario ya guardado en otro dispositivo: se ve lo de la cuenta.
- [ ] Con un formulario ya guardado y SIN conexion: abre con lo guardado en el telefono.

---

# Leer cantidades de un documento (nuevo)

Requiere una development build (no funciona en Expo Go): `npx expo install expo-text-extractor` y despues
`npx expo run:android` (o `run:ios`). Probar en telefono fisico con un documento real (constancia de sueldos, recibo de nomina).

- [ ] En Expo Go: la pantalla del documento se ve normal y en lugar del boton aparece "Tu teléfono no permite leer cantidades..." (no truena).
- [ ] Documento > "Leer cantidades del documento": aparece "Leyendo..." y despues la lista "Cantidades encontradas".
- [ ] Cada cantidad coincide con la del documento (compara a ojo la imagen de arriba con la lista).
- [ ] Tocar una cantidad la copia sin $ ni comas ("345678.9" o "345678.90"); pegarla en un campo de Mis datos de dinero funciona.
- [ ] Fechas, RFC, CURP, folios, telefonos y porcentajes NO aparecen como cantidades.
- [ ] "Mostrar otros números" muestra enteros sueltos (por ejemplo el año) y se copian tal cual.
- [ ] Foto borrosa o sin numeros: aparece el mensaje de "No encontramos cantidades".
- [ ] En modo avion, en la pantalla de Nuevo documento (foto recien tomada) la lectura funciona sin internet. En el detalle de un documento guardado necesita internet (baja la imagen).
- [ ] Android, primera vez sin internet: la lectura puede fallar porque Google descarga el modelo de texto; con internet funciona y despues ya no lo necesita.
- [ ] Probar el mismo documento en Android y en iOS y comparar las etiquetas (los formatos de salida son distintos).
- [ ] Leer de nuevo reinicia las marcas de "copiado".

---

# Rediseño visual (nuevo)

Revisar en telefono fisico, en Android e iOS, con letra normal y con "texto grande" del sistema.

- [ ] Inicio: "Trámites SAT" es la tarjeta verde destacada; Documentos, Calendario, Guías y Mi perfil van en cuadricula; Configuración es una fila. Todo cabe sin recortar el texto.
- [ ] Trámites SAT: los trámites aparecen agrupados por categoria (Declaraciones, RFC y datos fiscales, ...). Al escribir en el buscador o elegir una categoria, la lista se vuelve una sola y muestra la categoria sobre cada titulo.
- [ ] Las categorias (chips) se desplazan hasta el borde de la pantalla, sin cortarse al inicio.
- [ ] Detalle de un trámite: encabezado con categoria y "Ingresas con"; "Qué necesitas" muestra "0 de N listos" y avanza al marcar; los pasos van numerados con una linea que los une.
- [ ] El boton "Abrir: ..." queda fijo abajo mientras haces scroll y abre el portal. Con el teclado abierto no tapa nada importante.
- [ ] Tus datos: cada dato se copia con un toque y cambia a "Copiado" por un momento.
- [ ] Datos de dinero: la pantalla tiene las pestañas Capturar y Copiar. Al guardar aparece "Ir a copiar mis datos". Al cambiar de pestaña NO se pierde lo escrito ni las marcas de "copiado".
- [ ] Copiar: "0 de N copiados" con una barra que avanza; "Quitar marcas" reinicia.
- [ ] Documentos: "Tomar foto" y "De la galería" tienen la misma altura; los documentos van en una sola tarjeta con separadores.
- [ ] Ya no hay etiquetas en MAYUSCULAS en ninguna pantalla (registro, recordatorios incluidos).
- [ ] Con "texto grande" del sistema ningun boton ni fila corta su texto.

---

# Mi perfil (nuevo)

No hace falta ejecutar SQL nuevo: el permiso de editar solo el domicilio ya viene de `supabase/003_perfil_solo_domicilio.sql` (si no la has ejecutado, hazlo antes).

## Ver el perfil
- [ ] Inicio > Mi perfil: aparece el avatar con tus iniciales, tu nombre completo y tu correo.
- [ ] "Datos personales" muestra nombre, apellidos, RFC, fecha de nacimiento (dd/mm/aaaa) y correo. Cada uno se copia con un toque.
- [ ] El numero interior solo aparece si lo capturaste al registrarte.
- [ ] Sin conexion: aparece el mensaje de error con "Reintentar" (no se queda cargando para siempre).

## Editar el domicilio
- [ ] "Editar domicilio" abre el formulario con los valores guardados.
- [ ] Vaciar la calle y guardar: "La calle es obligatoria." y no se envia nada. Poner un CP de 4 digitos: "El código postal debe tener 5 dígitos."
- [ ] Cambiar la colonia y guardar: regresa al perfil, aparece "Domicilio actualizado." (desaparece sola a los ~4 s) y el perfil muestra el dato nuevo.
- [ ] En Supabase > Table Editor > usuario: la fila cambio y `updated_at` se actualizo.
- [ ] Guardar sin cambiar nada: regresa sin mensaje de "actualizado" y sin enviar nada.
- [ ] Quitar el numero interior y guardar: en Supabase queda `null` (no una cadena vacia).
- [ ] Sin conexion al guardar: aparece "No hay conexión..." y el formulario conserva lo escrito.
- [ ] "Cancelar" y la flecha de atras regresan sin guardar.

## Seguridad (lo decide la base de datos, no la app)
- [ ] Desde Supabase > SQL Editor, como usuario autenticado, intentar `update usuario set nombre = 'X'` (o rfc, correo, nacimiento, id_rol) falla con "permission denied". Solo se permiten calle, num_ext, num_int, colonia, cp, municipio y estado.
- [ ] Con dos cuentas: cada una ve y edita solo su propia fila.

## Enlaces
- [ ] "Cambio de domicilio ante el SAT" abre la guia del tramite; "Contraseña y sesión" abre Configuracion.

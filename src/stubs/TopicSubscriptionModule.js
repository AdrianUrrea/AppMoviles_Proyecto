// Sustituto de ExpoTopicSubscriptionModule SOLO para Android.
// expo-notifications 58 exige este modulo nativo al cargarse, y Expo Go para Android no lo incluye,
// lo que tumbaba toda la app. Este proyecto no usa suscripcion a temas de Firebase (solo notificaciones
// locales), asi que se reemplaza por un objeto vacio: si alguna vez se llamara, expo-notifications
// lanza un error de "no disponible" en vez de fallar al arrancar. Ver metro.config.js.
export default {};

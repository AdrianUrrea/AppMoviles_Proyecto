import { Alert } from 'react-native';

/** Dialogo de confirmacion como promesa: true si el usuario acepta. Permite que un Button quede bloqueado mientras se decide. */
export function confirmar(titulo: string, mensaje: string, textoAceptar = 'Eliminar'): Promise<boolean> {
  return new Promise((resolve) => {
    Alert.alert(
      titulo,
      mensaje,
      [
        { text: 'Cancelar', style: 'cancel', onPress: () => resolve(false) },
        { text: textoAceptar, style: 'destructive', onPress: () => resolve(true) },
      ],
      { cancelable: true, onDismiss: () => resolve(false) },
    );
  });
}

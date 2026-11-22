import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ComponentRef, ReactNode } from 'react';
import { Keyboard, KeyboardAvoidingView, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { TecladoContext } from '@/components/ui/teclado';
import { desplazamientoParaVer } from '@/lib/teclado';
import { colors, radius, spacing } from '@/theme';

type Props = {
  children: ReactNode;
  /** false para pantallas cortas que no necesitan scroll (login, dashboard). */
  scroll?: boolean;
  /** true si la pantalla ya tiene encabezado nativo (evita duplicar el margen superior). */
  conEncabezado?: boolean;
  /** Barra fija abajo con la accion principal de la pantalla (siempre a la vista, sin importar el scroll). */
  pie?: ReactNode;
  /** Separacion vertical entre los bloques de la pantalla. */
  espaciado?: number;
  /** Encabezado del color de marca a todo lo ancho, bajo la barra de estado (saludo del dashboard). */
  hero?: ReactNode;
};

/** Aire entre el campo enfocado y el borde del teclado o de la barra fija. */
const MARGEN_CAMPO = 24;

/**
 * Contenedor de pantalla: area segura + teclado que no tapa campos + scroll opcional.
 *
 * Teclado, en dos partes:
 *  1. `KeyboardAvoidingView` con `behavior="padding"` y el desfase REAL de la pantalla. Calcula cuanto subir
 *     suponiendo que esta pegado al borde superior; si hay un encabezado encima (casi todas las pantallas), sube de
 *     menos y el teclado tapa lo de abajo. Por eso se mide donde esta de verdad (`measureInWindow`).
 *  2. Al enfocar un campo (`useVerCampoEnfocado`), el scroll se mueve para dejarlo visible: reducir el area no basta,
 *     un campo de abajo puede quedar fuera de ella.
 */
export function Screen({ children, scroll = true, conEncabezado = false, pie, espaciado = spacing.lg, hero }: Props) {
  const insets = useSafeAreaInsets();
  const marco = useRef<ComponentRef<typeof View>>(null);
  const scrollRef = useRef<ComponentRef<typeof ScrollView>>(null);
  const scrollY = useRef(0);
  const alturaPie = useRef(0);
  const esperandoTeclado = useRef(false);
  const temporizador = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [desfase, setDesfase] = useState(0);

  const medirMarco = useCallback(() => {
    marco.current?.measureInWindow((_x, y) => {
      if (Number.isFinite(y)) setDesfase(Math.round(y));
    });
  }, []);

  const ajustarScroll = useCallback(() => {
    const campo = TextInput.State.currentlyFocusedInput();
    const teclado = Keyboard.metrics();
    const lista = scrollRef.current;
    if (!campo || !teclado || !lista || !marco.current) return;
    marco.current.measureInWindow((_mx, marcoY) => {
      campo.measureInWindow((_cx, campoY, _cw, campoAlto) => {
        const delta = desplazamientoParaVer({
          campoArriba: campoY,
          campoAbajo: campoY + campoAlto,
          zonaArriba: marcoY,
          zonaAbajo: teclado.screenY - alturaPie.current,
          margen: MARGEN_CAMPO,
        });
        if (delta !== 0) lista.scrollTo({ y: Math.max(0, scrollY.current + delta), animated: true });
      });
    });
  }, []);

  const programar = useCallback(
    (ms: number) => {
      if (temporizador.current) clearTimeout(temporizador.current);
      temporizador.current = setTimeout(ajustarScroll, ms); // deja que termine el relayout del teclado
    },
    [ajustarScroll],
  );

  useEffect(() => {
    const alMostrar = Keyboard.addListener('keyboardDidShow', () => {
      if (!esperandoTeclado.current) return;
      esperandoTeclado.current = false;
      programar(120);
    });
    const alOcultar = Keyboard.addListener('keyboardDidHide', () => {
      esperandoTeclado.current = false;
    });
    return () => {
      alMostrar.remove();
      alOcultar.remove();
      if (temporizador.current) clearTimeout(temporizador.current);
    };
  }, [programar]);

  const contexto = useMemo(
    () => ({
      verCampoEnfocado: () => {
        if (Keyboard.isVisible()) programar(60); // cambio de un campo a otro con el teclado ya abierto
        else esperandoTeclado.current = true; // se ajusta cuando el teclado termine de aparecer
      },
    }),
    [programar],
  );

  return (
    <SafeAreaView style={styles.safe} edges={conEncabezado || hero ? ['left', 'right', 'bottom'] : undefined}>
      {hero ? (
        <View style={[styles.hero, { paddingTop: insets.top + spacing.lg }]}>
          <View style={styles.heroInterior}>{hero}</View>
        </View>
      ) : null}
      <TecladoContext.Provider value={contexto}>
        <View ref={marco} style={styles.flex} collapsable={false} onLayout={medirMarco}>
          <KeyboardAvoidingView style={styles.flex} behavior="padding" keyboardVerticalOffset={desfase}>
            {scroll ? (
              <ScrollView
                ref={scrollRef}
                contentContainerStyle={[styles.content, { gap: espaciado }]}
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode="on-drag"
                showsVerticalScrollIndicator={false}
                scrollEventThrottle={16}
                onScroll={(e) => {
                  scrollY.current = e.nativeEvent.contentOffset.y;
                }}
              >
                {children}
              </ScrollView>
            ) : (
              <View style={[styles.content, styles.flex, { gap: espaciado }]}>{children}</View>
            )}
            {pie ? (
              <View
                style={styles.pie}
                onLayout={(e) => {
                  alturaPie.current = e.nativeEvent.layout.height;
                }}
              >
                <View style={styles.pieInterior}>{pie}</View>
              </View>
            ) : null}
          </KeyboardAvoidingView>
        </View>
      </TecladoContext.Provider>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  hero: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xl,
    borderBottomLeftRadius: radius.xl,
    borderBottomRightRadius: radius.xl,
  },
  heroInterior: { maxWidth: 520, width: '100%', alignSelf: 'center' },
  flex: { flex: 1 },
  content: {
    flexGrow: 1,
    padding: spacing.xl,
    gap: spacing.lg,
    maxWidth: 520,
    width: '100%',
    alignSelf: 'center',
  },
  pie: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.line,
  },
  pieInterior: { maxWidth: 520, width: '100%', alignSelf: 'center', gap: spacing.sm },
});

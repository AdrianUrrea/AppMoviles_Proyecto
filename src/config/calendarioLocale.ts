import { LocaleConfig } from 'react-native-calendars';
import { DIAS_CORTOS, DIAS_SEMANA, MESES, MESES_CORTOS } from '@/recordatorios/nombres';
import { capitalizar } from '@/recordatorios/logica';

LocaleConfig.locales.es = {
  monthNames: MESES.map(capitalizar),
  monthNamesShort: MESES_CORTOS.map(capitalizar),
  dayNames: DIAS_SEMANA.map(capitalizar),
  dayNamesShort: [...DIAS_CORTOS],
  today: 'Hoy',
};
LocaleConfig.defaultLocale = 'es';

import { BorderRadius, Colors, Spacing, Typography } from '@/constants/theme';
import React from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';

export interface FormulaVariable {
  symbol: string;
  meaning: string;
  value: string;
}

interface SymbolInfo {
  name: string;
  description: string;
}

/**
 * Glosario de simbología de las fórmulas (M10).
 * Traduce cada símbolo matemático a lenguaje agronómico para el planificador.
 */
const SYMBOL_LIBRARY: Record<string, SymbolInfo> = {
  E_sem: {
    name: 'Demanda semanal de huevos',
    description:
      'Huevos que consume la familia en 7 días. Se suman todos los grupos de edad: porción × veces al día × días por semana.',
  },
  M_sem: {
    name: 'Demanda semanal de carne',
    description:
      'Gramos de carne consumidos por la familia en 7 días, expresados en kilogramos.',
  },
  M_año: {
    name: 'Demanda anual de carne',
    description: 'Demanda semanal multiplicada por las 52 semanas del año (D-01).',
  },
  G: {
    name: 'Ponedoras requeridas',
    description:
      'Gallinas (o codornices) en postura necesarias para cubrir la demanda, redondeado siempre hacia arriba.',
  },
  P: {
    name: 'Tasa de postura diaria',
    description:
      'Proporción de ponedoras que pone un huevo cada día según el escenario elegido (valor entre 0 y 1).',
  },
  U: {
    name: 'Aprovechamiento',
    description: 'Proporción del huevo que llega a la mesa; descuenta roturas y mermas de manejo.',
  },
  S: {
    name: 'Margen de seguridad',
    description: 'Holgura que se suma al cálculo para no quedar corto ante imprevistos.',
  },
  Y: {
    name: 'Rendimiento comestible por ave',
    description: 'Kilogramos de carne aprovechable que aporta cada ave llevada al sacrificio.',
  },
  m: {
    name: 'Mortalidad esperada',
    description: 'Proporción de aves que se pierde antes del sacrificio (valor entre 0 y 1).',
  },
  A_slaughter: {
    name: 'Aves para sacrificio',
    description: 'Aves que deben sacrificarse para cubrir la demanda anual con margen de seguridad.',
  },
  A_initial: {
    name: 'Aves iniciales',
    description:
      'Pollitos o codornices que hay que iniciar para que, después de la mortalidad, queden las aves de sacrificio.',
  },
  H: {
    name: 'Huevos fértiles a incubar',
    description: 'Huevos que hay que poner en incubadora para obtener las hembras de reemplazo deseadas.',
  },
  R: {
    name: 'Hembras de reemplazo deseadas',
    description: 'Cantidad de hembras que se quieren obtener del proceso reproductivo.',
  },
  f: {
    name: 'Fertilidad',
    description: 'Proporción de huevos incubados que resultan fértiles.',
  },
  h: {
    name: 'Incubabilidad',
    description: 'Proporción de huevos fértiles que llegan a eclosionar.',
  },
  s: {
    name: 'Supervivencia',
    description: 'Proporción de aves nacidas que sobrevive hasta el objetivo.',
  },
  p_female: {
    name: 'Proporción de hembras',
    description: 'Proporción de hembras entre las aves nacidas (habitualmente 0,5).',
  },
};

const SYMBOL_TOKEN = /([A-Za-z]+)_([A-Za-zñ]+)/;

/** Convierte ceil(x) en corchetes matemáticos ⌈x⌉ respetando paréntesis anidados. */
const withCeilBrackets = (text: string): string => {
  let output = '';
  let index = 0;

  while (index < text.length) {
    if (text.startsWith('ceil(', index)) {
      let depth = 1;
      let cursor = index + 5;
      for (; cursor < text.length && depth > 0; cursor += 1) {
        if (text[cursor] === '(') depth += 1;
        else if (text[cursor] === ')') depth -= 1;
      }
      const inner = text.slice(index + 5, cursor - 1);
      output += `⌈ ${withCeilBrackets(inner)} ⌉`;
      index = cursor;
    } else {
      output += text[index];
      index += 1;
    }
  }

  return output;
};

const MathSymbol: React.FC<{ base: string; sub?: string }> = ({ base, sub }) => (
  <Text style={styles.mathSymbol}>
    {base}
    {sub ? <Text style={styles.mathSubscript}>{sub}</Text> : null}
  </Text>
);

/** Renderiza un enunciado matemático con subíndices reales (E_sem -> E con subíndice sem). */
const renderMath = (text: string, keyPrefix: string): React.ReactNode[] => {
  const parts = text.split(SYMBOL_TOKEN);
  const nodes: React.ReactNode[] = [];

  for (let i = 0; i < parts.length; i += 3) {
    const plain = parts[i];
    const base = parts[i + 1];
    const sub = parts[i + 2];
    if (plain) nodes.push(<Text key={`${keyPrefix}-t${i}`}>{plain}</Text>);
    if (base) nodes.push(<MathSymbol key={`${keyPrefix}-s${i}`} base={base} sub={sub} />);
  }

  return nodes;
};

interface FormulaBreakdownProps {
  formulaText: string;
  variables: FormulaVariable[];
  caption?: string;
}

export const FormulaBreakdown: React.FC<FormulaBreakdownProps> = ({
  formulaText,
  variables,
  caption = 'Cada símbolo corresponde a un dato del cálculo:',
}) => {
  const lines = withCeilBrackets(formulaText)
    .split(';')
    .map((line) => line.trim())
    .filter(Boolean);

  return (
    <View>
      <View style={styles.formulaBox}>
        {lines.map((line, index) => (
          <Text key={`line-${index}`} style={styles.formulaLine}>
            {renderMath(line, `line-${index}`)}
          </Text>
        ))}
      </View>

      <Text style={styles.caption}>{caption}</Text>

      <View style={styles.legend}>
        {variables.map((variable, index) => {
          const know = SYMBOL_LIBRARY[variable.symbol];
          const [base, sub] = variable.symbol.split('_');

          return (
            <View
              key={`${variable.symbol}-${index}`}
              style={[
                styles.legendRow,
                index < variables.length - 1 && styles.legendDivider,
              ]}
            >
              <View style={styles.symbolChip}>
                <MathSymbol base={base} sub={sub} />
              </View>

              <View style={styles.legendBody}>
                <Text style={styles.legendName}>{know ? know.name : variable.meaning}</Text>
                {know ? <Text style={styles.legendDescription}>{know.description}</Text> : null}
                <Text style={styles.legendValue}>{variable.value}</Text>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  formulaBox: {
    backgroundColor: Colors.bone,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    gap: Spacing.xs,
  },
  formulaLine: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 14,
    lineHeight: 22,
    color: Colors.ink,
  },
  mathSymbol: {
    fontStyle: 'italic',
    fontWeight: '700',
    color: Colors.ink,
  },
  mathSubscript: {
    fontStyle: 'italic',
    fontWeight: '700',
    fontSize: 10,
    color: Colors.ink,
  },
  caption: {
    ...Typography.caption,
    color: Colors.ash,
    marginTop: Spacing.md,
    marginBottom: Spacing.xs,
  },
  legend: {
    borderTopWidth: 1,
    borderTopColor: Colors.hairline,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: Spacing.sm,
  },
  legendDivider: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.hairline,
  },
  symbolChip: {
    width: 46,
    height: 32,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.bone,
    borderWidth: 1,
    borderColor: Colors.hairline,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  legendBody: {
    flex: 1,
  },
  legendName: {
    ...Typography.captionBold,
    color: Colors.ink,
  },
  legendDescription: {
    ...Typography.caption,
    color: Colors.ash,
    fontSize: 12,
    lineHeight: 17,
    marginTop: 1,
  },
  legendValue: {
    ...Typography.captionBold,
    color: Colors.ink,
    marginTop: 4,
  },
});

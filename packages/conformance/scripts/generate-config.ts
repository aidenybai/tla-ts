import { writeTest } from "./generate-common";

const CONFIG_VALUES = [
  { name: "integer", text: "1" },
  { name: "negative", text: "-1" },
  { name: "string", text: '"a"' },
  { name: "string_empty", text: '""' },
  { name: "true", text: "TRUE" },
  { name: "false", text: "FALSE" },
  { name: "model_value", text: "m" },
  { name: "self", text: "c" },
  { name: "set_empty", text: "{}" },
  { name: "set_ints", text: "{1, 2}" },
  { name: "set_strings", text: '{"a", "b"}' },
  { name: "set_model_values", text: "{m, n}" },
  { name: "set_mixed", text: '{1, "a", m}' },
  { name: "set_nested", text: "{{1}, {}}" },
  { name: "set_typed_model_values", text: "{t_a, t_b}" },
  { name: "typed_model_value", text: "t_a" },
  { name: "tuple", text: "<<1, 2>>" },
  { name: "tuple_empty", text: "<<>>" },
  { name: "tuple_nested", text: '<<1, <<"a">>, {m}>>' },
  { name: "definition", text: "Def" },
  { name: "interval_rejected", text: "1..2" },
  { name: "expression_rejected", text: "1 + 1" },
  { name: "record_rejected", text: "[a |-> 1]" },
  { name: "too_big", text: "2147483648" },
];

const USES = [
  { name: "print", text: "ASSUME PrintT(c)" },
  { name: "equal_itself", text: "ASSUME PrintT(c = c)" },
  { name: "equal_integer", text: "ASSUME PrintT(c = 1)" },
  { name: "equal_string", text: 'ASSUME PrintT(c = "a")' },
  { name: "membership", text: "ASSUME PrintT(1 \\in c)" },
  { name: "cardinality", text: "ASSUME PrintT(Cardinality(c))" },
  { name: "length", text: "ASSUME PrintT(Len(c))" },
  { name: "add", text: "ASSUME PrintT(c + 1)" },
  { name: "set_of", text: "ASSUME PrintT({c, c})" },
  { name: "choose", text: "ASSUME PrintT(CHOOSE e \\in c : TRUE)" },
  { name: "state_value", text: "VARIABLE x\nInit == x = c\nNext == x' = x\nASSUME PrintT(c)" },
];

const FORMS = [
  { name: "assignment", render: (value: string) => `CONSTANT c = ${value}` },
  { name: "override", render: (value: string) => `CONSTANT c <- ${value}` },
];

export const generateConfigMatrix = () =>
  FORMS.forEach((form) =>
    CONFIG_VALUES.forEach((value) =>
      USES.forEach((use) => {
        const hasBehavior = use.text.startsWith("VARIABLE");
        writeTest(
          `config_values/${form.name}/${value.name}`,
          {
            description: `Sets a constant to ${value.name} through ${form.name}, then uses it through ${use.name}.`,
            ref: "tlc2/tool/impl/ModelConfig.java#parse; tlc2/tool/impl/SpecProcessor.java#processConstants",
            // An integer past 32 bits in a .cfg assignment is an uncaught NumberFormatException in ModelConfig#parse.
            features:
              form.name === "assignment" && value.name === "too_big"
                ? ["config-values", "tlc-bug"]
                : ["config-values"],
            outcome: "any",
            config: `${hasBehavior ? "INIT Init\nNEXT Next\n" : ""}${form.render(value.text)}\nCONSTANT m = m\nCONSTANT n = n\nCONSTANT t_a = t_a\nCONSTANT t_b = t_b\n`,
          },
          `cfg_${form.name}__${value.name}__${use.name}`,
          `EXTENDS Integers, Sequences, FiniteSets, TLC\nCONSTANTS c, m, n, t_a, t_b\nDef == 7\n${use.text}`,
        );
      }),
    ),
  );

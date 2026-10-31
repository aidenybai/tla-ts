// The recorded obligations where tla-ts deliberately differs from tlapm, because tlapm is wrong
// there. The conformance scripts report them apart from mismatches, with the tlapm source at fault.

interface Deviation {
  module: string;
  id: number;
  source: string;
  reason: string;
}

const DEVIATIONS: Deviation[] = [
  {
    module: "tlapm/test/fast/language/parse_function_comma_args.tla",
    id: 2,
    source: "src/backend/smtlib.ml:339-366 at 62e7a03",
    reason:
      "Smtlib.pp_print_expr prints each LET definition in the context outside the LET, so Z3 rejects tlapm's input",
  },
];

// Why tla-ts differs from tlapm on an obligation, if it does on purpose.
export const getDeviation = (module: string, id: number) => {
  const deviation = DEVIATIONS.find(
    (innerDeviation) => innerDeviation.module === module && innerDeviation.id === id,
  );
  return deviation && `tlapm ${deviation.source}: ${deviation.reason}`;
};

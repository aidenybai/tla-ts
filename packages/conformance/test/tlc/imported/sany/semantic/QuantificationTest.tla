(*---
description: "Ported from SANY's semantic corpus: QuantificationTest.tla."
source: tlatools/org.lamport.tlatools/test/tla2sany/semantic/corpus/QuantificationTest.tla
features:
  - sany-semantic
outcome: parse-error
---*)
------------------------ MODULE QuantificationTest --------------------------
EXTENDS Semantics

CONSTANT (* ID: c *) c
VARIABLE (* ID: v *) v

THEOREM Basic == IsLevel(
  \A (* ID: Basic!x *) x \in RefersTo(c, "c") :
    IsLevel(RefersTo(x, "Basic!x"), ConstantLevel),
  ConstantLevel
)

THEOREM Multiple == IsLevel(
  \E (* ID: Multiple!x *) x, (* ID: Multiple!y *) y \in RefersTo(c, "c") :
    IsLevel(<<
      RefersTo(x, "Multiple!x"),
      RefersTo(y, "Multiple!y")
    >>, ConstantLevel),
  ConstantLevel
)

THEOREM Tuple == IsLevel(
  \A <<(* ID: Tuple!x *) x, (* ID: Tuple!y *) y, (* ID: Tuple!z *) z>> \in RefersTo(c, "c") :
    IsLevel(<<RefersTo(x, "Tuple!x"), RefersTo(y, "Tuple!y"), RefersTo(z, "Tuple!z")>>, ConstantLevel),
  ConstantLevel
)

THEOREM BasicVariable == IsLevel(
  \E (* ID: BasicVariable!x *) x \in RefersTo(v, "v") :
    IsLevel(RefersTo(x, "BasicVariable!x"), ConstantLevel),
  VariableLevel
)

THEOREM BasicAction == IsLevel(
  \A (* ID: BasicAction!x *) x \in RefersTo(v, "v")' :
    IsLevel(x, ConstantLevel)',
  ActionLevel
)

THEOREM BasicTemporal == IsLevel(
  \E (* ID: BasicTemporal!x *) x \in RefersTo(v, "v") :
    []IsLevel(x, ConstantLevel),
  TemporalLevel
)

THEOREM ForAllUnbound == IsLevel(
  \A (* ID: ForAllUnbound!x *) x, (* ID: ForAllUnbound!y *) y : <<
    IsLevel(RefersTo(x, "ForAllUnbound!x"), ConstantLevel),
    IsLevel(RefersTo(y, "ForAllUnbound!y"), ConstantLevel)
  >>,
  ConstantLevel
)

THEOREM ExistsUnbound == IsLevel(
  \E (* ID: ExistsUnbound!x *) x, (* ID: ExistsUnbound!y *) y : <<
    IsLevel(RefersTo(x, "ExistsUnbound!x"), ConstantLevel),
    IsLevel(RefersTo(y, "ExistsUnbound!y"), ConstantLevel)
  >>,
  ConstantLevel
)

THEOREM TemporalForAllUnbound == IsLevel(
  \AA (* ID: TemporalForAllUnbound!x *) x, (* ID: TemporalForAllUnbound!y *) y : <<
    IsLevel(RefersTo(x, "TemporalForAllUnbound!x"), ConstantLevel),
    IsLevel(RefersTo(y, "TemporalForAllUnbound!y"), ConstantLevel)
  >>,
  TemporalLevel
)

THEOREM TemporalExistsUnbound == IsLevel(
  \EE (* ID: TemporalForAllUnbound!x *) x, (* ID: TemporalForAllUnbound!y *) y : <<
    IsLevel(RefersTo(x, "TemporalForAllUnbound!x"), ConstantLevel),
    IsLevel(RefersTo(y, "TemporalForAllUnbound!y"), ConstantLevel)
  >>,
  TemporalLevel
)

=============================================================================

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Fatal errors while parsing TLA+ spec in file QuantificationTest
    | In module QuantificationTest
    | Cannot find source file for module Semantics imported in module QuantificationTest.
    | *** Errors: 1
    | In module QuantificationTest
    | Cannot find source file for module Semantics imported in module QuantificationTest.
    3002:1 Parsing or semantic analysis failed.
---*)

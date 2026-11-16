(*---
description: "Ported from SANY's semantic corpus: SetsTest.tla."
source: tlatools/org.lamport.tlatools/test/tla2sany/semantic/corpus/SetsTest.tla
features:
  - sany-semantic
outcome: parse-error
---*)
----------------------------- MODULE SetsTest -------------------------------
EXTENDS Semantics
CONSTANT (* ID: c *) c
VARIABLE (* ID: v *) v

THEOREM EmptySet == IsLevel({}, ConstantLevel)

THEOREM ConstantSetLiteral == IsLevel({1,2,3,4,5}, ConstantLevel)

THEOREM VariableSetLiteral == IsLevel({1,2,RefersTo(v, "v"),4,5}, VariableLevel)

THEOREM ActionSetLiteral == IsLevel({RefersTo(c, "c"), RefersTo(v, "v"), v'}, ActionLevel)

THEOREM SetFilter == IsLevel(
  {(* ID: SetFilter!x *) x \in RefersTo(c, "c") : RefersTo(x, "SetFilter!x")},
  ConstantLevel
)

THEOREM TupleFilter == IsLevel({
  <<(* ID: TupleFilter!x *) x, (* ID: TupleFilter!y *) y>> \in RefersTo(v, "v")
    : {RefersTo(x, "TupleFilter!x"), RefersTo(y, "TupleFilter!y")}
  },
  VariableLevel
)

THEOREM SetMap == IsLevel({
  {RefersTo(x, "SetMap!x"), RefersTo(y, "SetMap!y"), RefersTo(z, "SetMap!z")} :
    (* ID: SetMap!x *) x, (* ID: SetMap!y *) y \in RefersTo(c, "c"),
    <<(* ID: SetMap!z *) z>> \in RefersTo(v, "v")
  },
  VariableLevel
)

=============================================================================

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Fatal errors while parsing TLA+ spec in file SetsTest
    | In module SetsTest
    | Cannot find source file for module Semantics imported in module SetsTest.
    | *** Errors: 1
    | In module SetsTest
    | Cannot find source file for module Semantics imported in module SetsTest.
    3002:1 Parsing or semantic analysis failed.
---*)

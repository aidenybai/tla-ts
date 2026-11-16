(*---
description: "Ported from SANY's semantic corpus: RecordsTest.tla."
source: tlatools/org.lamport.tlatools/test/tla2sany/semantic/corpus/RecordsTest.tla
features:
  - sany-semantic
outcome: parse-error
---*)
--------------------------- MODULE RecordsTest ------------------------------
EXTENDS Semantics
CONSTANT (* ID: c *) c
VARIABLE (* ID: v *) v

THEOREM ConstantRecord == IsLevel([
    x |-> IsLevel(RefersTo(c, "c"), ConstantLevel),
    y |-> IsLevel(RefersTo(c, "c"), ConstantLevel)
  ],
  ConstantLevel
)

THEOREM ConstantRecordSet == IsLevel([
    x : IsLevel(RefersTo(c, "c"), ConstantLevel),
    y : IsLevel(RefersTo(c, "c"), ConstantLevel)
  ],
  ConstantLevel
)

THEOREM VariableRecord == IsLevel([
    x |-> IsLevel(RefersTo(v, "v"), VariableLevel),
    y |-> IsLevel(RefersTo(c, "c"), ConstantLevel)
  ],
  VariableLevel
)

THEOREM VariableRecordSet == IsLevel([
    x : IsLevel(RefersTo(v, "v"), VariableLevel),
    y : IsLevel(RefersTo(c, "c"), ConstantLevel)
  ],
  VariableLevel
)

THEOREM ActionRecord == IsLevel([
    x |-> IsLevel(RefersTo(v, "v")', ActionLevel),
    y |-> IsLevel(RefersTo(c, "c"), ConstantLevel)
  ],
  ActionLevel
)

THEOREM ActionRecordSet == IsLevel([
    x : IsLevel(RefersTo(v, "v")', ActionLevel),
    y : IsLevel(RefersTo(c, "c"), ConstantLevel)
  ],
  ActionLevel
)

THEOREM TemporalRecord == IsLevel([
    x |-> IsLevel([]RefersTo(v, "v"), TemporalLevel),
    y |-> IsLevel(RefersTo(c, "c"), ConstantLevel)
  ],
  TemporalLevel
)

-----------------------------------------------------------------------------

THEOREM [c |-> c] = [ x \in {"c"} |-> c]  

THEOREM \E self \in {}: [ v |-> v[self] ]

ASSUME DOMAIN [v |-> "white", q |-> c] # {}
ASSUME DOMAIN [q |-> c, v |-> "white"] # {}

Rational(num) == [num |-> num]
ASSUME DOMAIN Rational(42) # {}

N == {c}
THEOREM v \in [ p: N, q: {0}, v: {"white"} ]

=============================================================================

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Fatal errors while parsing TLA+ spec in file RecordsTest
    | In module RecordsTest
    | Cannot find source file for module Semantics imported in module RecordsTest.
    | *** Errors: 1
    | In module RecordsTest
    | Cannot find source file for module Semantics imported in module RecordsTest.
    3002:1 Parsing or semantic analysis failed.
---*)

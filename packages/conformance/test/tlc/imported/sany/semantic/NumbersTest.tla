(*---
description: "Ported from SANY's semantic corpus: NumbersTest.tla."
source: tlatools/org.lamport.tlatools/test/tla2sany/semantic/corpus/NumbersTest.tla
features:
  - sany-semantic
outcome: parse-error
---*)
--------------------------- MODULE NumbersTest ------------------------------
EXTENDS Semantics, Naturals, Integers, Reals

ASSUME IsLevel(12345, ConstantLevel)
ASSUME IsLevel(12345.67890, ConstantLevel)
ASSUME IsLevel(\b01010101, ConstantLevel)
ASSUME IsLevel(\B10101010, ConstantLevel)
ASSUME IsLevel(\o01234567, ConstantLevel)
ASSUME IsLevel(\O76543210, ConstantLevel)
ASSUME IsLevel(\h01234, ConstantLevel)
ASSUME IsLevel(\h56789, ConstantLevel)
ASSUME IsLevel(\habcdef, ConstantLevel)
ASSUME IsLevel(\H98765, ConstantLevel)
ASSUME IsLevel(\H43210, ConstantLevel)
ASSUME IsLevel(\HFEDCBA, ConstantLevel)

ASSUME IsLevel(Nat, ConstantLevel)
ASSUME IsLevel(Int, ConstantLevel)
ASSUME IsLevel(Real, ConstantLevel)

=============================================================================

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Fatal errors while parsing TLA+ spec in file NumbersTest
    | In module NumbersTest
    | Cannot find source file for module Semantics imported in module NumbersTest.
    | *** Errors: 1
    | In module NumbersTest
    | Cannot find source file for module Semantics imported in module NumbersTest.
    3002:1 Parsing or semantic analysis failed.
---*)

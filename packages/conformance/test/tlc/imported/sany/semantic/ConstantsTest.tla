(*---
description: "Ported from SANY's semantic corpus: ConstantsTest.tla."
source: tlatools/org.lamport.tlatools/test/tla2sany/semantic/corpus/ConstantsTest.tla
features:
  - sany-semantic
outcome: parse-error
---*)
-------------------------- MODULE ConstantsTest -----------------------------
EXTENDS Semantics
CONSTANT
  (* ID: x *) x,
  (* ID: y *) y,
  (* ID: z *) z

ASSUME RefersTo(x, "x")
ASSUME RefersTo(y, "y")
ASSUME RefersTo(z, "z")
ASSUME IsLevel(x, ConstantLevel)
ASSUME IsLevel(y, ConstantLevel)
ASSUME IsLevel(z, ConstantLevel)

CONSTANTS
  (* ID: f *) f(_, _),
  (* ID: + *) _+_,
  (* ID: ^+ *) _^+

ASSUME RefersTo(f(1, 1), "f")
ASSUME RefersTo(1 + 1, "+")
ASSUME RefersTo(1^+, "^+")
ASSUME IsLevel(f(1, 1), ConstantLevel)
ASSUME IsLevel(1 + 1, ConstantLevel)
ASSUME IsLevel(1^+, ConstantLevel)

=============================================================================

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Fatal errors while parsing TLA+ spec in file ConstantsTest
    | In module ConstantsTest
    | Cannot find source file for module Semantics imported in module ConstantsTest.
    | *** Errors: 1
    | In module ConstantsTest
    | Cannot find source file for module Semantics imported in module ConstantsTest.
    3002:1 Parsing or semantic analysis failed.
---*)

(*---
description: The syntax corpus case "Mixed Bounded Quantification With Tuples" in quantification.txt, which tlapm's parser tests read.
ref: test/parser/syntax_corpus/quantification.txt
features:
  - tlapm-test
  - syntax-corpus
mode: obligations
outcome: rejected
---*)
---- MODULE quantification_mixed_bounded_quantification_with_tuples ----
EXTENDS TestPrelude
op1 == \A x, y \in Nat, <<z>> \in Int, a, b, c \in Real : FALSE
op2 == \E <<x, y>> \in Nat, a, b \in Int : TRUE
====
---- MODULE TestPrelude ----
CONSTANTS Nat, Real, Int
====

(*--- recorded
all:
  exit: 3
  transcript: |-
    @type: warning
    @msg: File "./quantification_mixed_bounded_quantification_with_tuples.tla", line 11, characters 9-19

    Unknown module "TestPrelude"

    File "./quantification_mixed_bounded_quantification_with_tuples.tla", line 11, characters 9-19:
    Error: Unknown module "TestPrelude"
     tlapm ending abnormally with Failure("Module.Parser.load_module")
---*)

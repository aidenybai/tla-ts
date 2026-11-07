(*---
description: The syntax corpus case "Assume/Prove with Mixed Assumptions" in assume-prove.txt, which tlapm's parser tests read.
ref: test/parser/syntax_corpus/assume-prove.txt
features:
  - tlapm-test
  - syntax-corpus
mode: obligations
outcome: rejected
---*)
---- MODULE assume_prove_assume_prove_with_mixed_assumptions ----
EXTENDS TestPrelude
THEOREM thm ==
  ASSUME
    NEW CONSTANT f,
    1 + 2,
    /\ 1
    /\ 2,
    lbl :: ASSUME P PROVE Q
  PROVE C
OMITTED
====
---- MODULE TestPrelude ----
x + y == 0
P == TRUE
Q == TRUE
C == TRUE
====

(*--- recorded
all:
  exit: 3
  transcript: |-
    @type: warning
    @msg: File "./assume_prove_assume_prove_with_mixed_assumptions.tla", line 11, characters 9-19

    Unknown module "TestPrelude"

    File "./assume_prove_assume_prove_with_mixed_assumptions.tla", line 11, characters 9-19:
    Error: Unknown module "TestPrelude"
     tlapm ending abnormally with Failure("Module.Parser.load_module")
---*)

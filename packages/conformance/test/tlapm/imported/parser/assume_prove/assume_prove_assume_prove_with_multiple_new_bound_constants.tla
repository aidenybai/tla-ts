(*---
description: The syntax corpus case "Assume/Prove With Multiple New Bound Constants" in assume-prove.txt, which tlapm's parser tests read.
ref: test/parser/syntax_corpus/assume-prove.txt
features:
  - tlapm-test
  - syntax-corpus
mode: obligations
outcome: rejected
---*)
---- MODULE assume_prove_assume_prove_with_multiple_new_bound_constants ----
EXTENDS TestPrelude
THEOREM thm ==
  ASSUME CONSTANT x \in S, CONSTANT y \in S
  PROVE C
OBVIOUS
====
---- MODULE TestPrelude ----
S == {0}
C == TRUE
====

(*--- recorded
all:
  exit: 3
  transcript: |-
    @type: warning
    @msg: File "./assume_prove_assume_prove_with_multiple_new_bound_constants.tla", line 11, characters 9-19

    Unknown module "TestPrelude"

    File "./assume_prove_assume_prove_with_multiple_new_bound_constants.tla", line 11, characters 9-19:
    Error: Unknown module "TestPrelude"
     tlapm ending abnormally with Failure("Module.Parser.load_module")
---*)

(*---
description: The syntax corpus case "Assume/Prove With New Bound Variable" in assume-prove.txt, which tlapm's parser tests read.
ref: test/parser/syntax_corpus/assume-prove.txt
features:
  - tlapm-test
  - syntax-corpus
mode: obligations
outcome: rejected
---*)
---- MODULE assume_prove_assume_prove_with_new_bound_variable ----
EXTENDS TestPrelude
THEOREM thm ==
  ASSUME NEW VARIABLE x
  PROVE C
OBVIOUS
====
---- MODULE TestPrelude ----
C == TRUE
====

(*--- recorded
all:
  exit: 3
  transcript: |-
    @type: warning
    @msg: File "./assume_prove_assume_prove_with_new_bound_variable.tla", line 11, characters 9-19

    Unknown module "TestPrelude"

    File "./assume_prove_assume_prove_with_new_bound_variable.tla", line 11, characters 9-19:
    Error: Unknown module "TestPrelude"
     tlapm ending abnormally with Failure("Module.Parser.load_module")
---*)

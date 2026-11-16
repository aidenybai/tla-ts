(*---
description: The syntax corpus case "Nested Assume/Prove With Label" in assume-prove.txt, which tlapm's parser tests read.
ref: test/parser/syntax_corpus/assume-prove.txt
features:
  - tlapm-test
  - syntax-corpus
mode: obligations
outcome: rejected
---*)
---- MODULE assume_prove_nested_assume_prove_with_label ----
EXTENDS TestPrelude
THEOREM thm ==
  ASSUME asm ::
    ASSUME P
    PROVE Q
  PROVE C
OMITTED
====
---- MODULE TestPrelude ----
P == TRUE
Q == TRUE
C == TRUE
====

(*--- recorded
all:
  exit: 3
  transcript: |-
    @type: warning
    @msg: File "./assume_prove_nested_assume_prove_with_label.tla", line 11, characters 9-19

    Unknown module "TestPrelude"

    File "./assume_prove_nested_assume_prove_with_label.tla", line 11, characters 9-19:
    Error: Unknown module "TestPrelude"
     tlapm ending abnormally with Failure("Module.Parser.load_module")
---*)

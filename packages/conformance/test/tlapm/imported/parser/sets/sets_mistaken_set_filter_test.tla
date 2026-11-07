(*---
description: The syntax corpus case "Mistaken Set Filter Test" in sets.txt, which tlapm's parser tests read.
ref: test/parser/syntax_corpus/sets.txt
features:
  - tlapm-test
  - syntax-corpus
mode: obligations
outcome: rejected
---*)
---- MODULE sets_mistaken_set_filter_test ----
EXTENDS TestPrelude
op1 == {x \in Nat}
op2 == {x \in BOOLEAN, y \in STRING}
====
---- MODULE TestPrelude ----
CONSTANT Nat
VARIABLES x, y
====

(*--- recorded
all:
  exit: 3
  transcript: |-
    @type: warning
    @msg: File "./sets_mistaken_set_filter_test.tla", line 11, characters 9-19

    Unknown module "TestPrelude"

    File "./sets_mistaken_set_filter_test.tla", line 11, characters 9-19:
    Error: Unknown module "TestPrelude"
     tlapm ending abnormally with Failure("Module.Parser.load_module")
---*)

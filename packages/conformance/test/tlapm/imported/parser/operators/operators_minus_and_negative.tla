(*---
description: The syntax corpus case "Minus and Negative" in operators.txt, which tlapm's parser tests read.
ref: test/parser/syntax_corpus/operators.txt
features:
  - tlapm-test
  - syntax-corpus
mode: obligations
outcome: rejected
---*)
---- MODULE operators_minus_and_negative ----
EXTENDS TestPrelude
op1 == -. (1)
op2 == - (1)
op3 == - 1 - 2
====
---- MODULE TestPrelude ----
-. x == 0
x - y == 1
====

(*--- recorded
all:
  exit: 3
  transcript: |-
    @type: warning
    @msg: File "./operators_minus_and_negative.tla", line 11, characters 9-19

    Unknown module "TestPrelude"

    File "./operators_minus_and_negative.tla", line 11, characters 9-19:
    Error: Unknown module "TestPrelude"
     tlapm ending abnormally with Failure("Module.Parser.load_module")
---*)

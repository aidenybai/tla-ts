(*---
description: The syntax corpus case "Fairness with Tuple Literal" in fairness.txt, which tlapm's parser tests read.
ref: test/parser/syntax_corpus/fairness.txt
features:
  - tlapm-test
  - syntax-corpus
mode: obligations
outcome: rejected
---*)
---- MODULE fairness_fairness_with_tuple_literal ----
EXTENDS TestPrelude
op1 == WF_<<x, y>>(f)
op2 == SF_x(f)
====
---- MODULE TestPrelude ----
VARIABLES f, x, y
====

(*--- recorded
all:
  exit: 3
  transcript: |-
    @type: warning
    @msg: File "./fairness_fairness_with_tuple_literal.tla", line 11, characters 9-19

    Unknown module "TestPrelude"

    File "./fairness_fairness_with_tuple_literal.tla", line 11, characters 9-19:
    Error: Unknown module "TestPrelude"
     tlapm ending abnormally with Failure("Module.Parser.load_module")
---*)

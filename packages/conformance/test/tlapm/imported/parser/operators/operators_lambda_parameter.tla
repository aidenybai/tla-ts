(*---
description: The syntax corpus case "LAMBDA Parameter" in operators.txt, which tlapm's parser tests read.
ref: test/parser/syntax_corpus/operators.txt
features:
  - tlapm-test
  - syntax-corpus
mode: obligations
outcome: rejected
---*)
---- MODULE operators_lambda_parameter ----
EXTENDS TestPrelude
op == f(LAMBDA x, y : x + y, LAMBDA x : 0)
====
---- MODULE TestPrelude ----
f(x(_, _), y(_)) == 0
x + y == 1
====

(*--- recorded
all:
  exit: 3
  transcript: |-
    @type: warning
    @msg: File "./operators_lambda_parameter.tla", line 11, characters 9-19

    Unknown module "TestPrelude"

    File "./operators_lambda_parameter.tla", line 11, characters 9-19:
    Error: Unknown module "TestPrelude"
     tlapm ending abnormally with Failure("Module.Parser.load_module")
---*)

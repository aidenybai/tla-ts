(*---
description: The syntax corpus case "Infix Operator as Parameter" in infix_op.txt, which tlapm's parser tests read.
ref: test/parser/syntax_corpus/infix_op.txt
features:
  - tlapm-test
  - syntax-corpus
mode: obligations
outcome: rejected
---*)
---- MODULE infix_op_infix_operator_as_parameter ----
EXTENDS TestPrelude
op == f(##, \otimes)
====
---- MODULE TestPrelude----
CONSTANTS _ ## _, _ \otimes _
f(x(_, _), y(_, _)) == 0
====

(*--- recorded
all:
  exit: 3
  transcript: |-
    @type: warning
    @msg: File "./infix_op_infix_operator_as_parameter.tla", line 11, characters 9-19

    Unknown module "TestPrelude"

    File "./infix_op_infix_operator_as_parameter.tla", line 11, characters 9-19:
    Error: Unknown module "TestPrelude"
     tlapm ending abnormally with Failure("Module.Parser.load_module")
---*)

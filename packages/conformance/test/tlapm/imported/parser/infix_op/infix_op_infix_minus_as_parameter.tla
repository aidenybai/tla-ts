(*---
description: The syntax corpus case "Infix Minus as Parameter" in infix_op.txt, which tlapm's parser tests read.
ref: test/parser/syntax_corpus/infix_op.txt
features:
  - tlapm-test
  - syntax-corpus
mode: obligations
outcome: rejected
---*)
---- MODULE infix_op_infix_minus_as_parameter ----
EXTENDS TestPrelude
op == f ( -. )
====
---- MODULE TestPrelude ----
f(x(_)) == 0
-. x == 1
====

(*--- recorded
all:
  exit: 3
  transcript: |-
    @type: warning
    @msg: File "./infix_op_infix_minus_as_parameter.tla", line 12, character 6
    incomplete expression

    @type: warning
    @msg: File "./infix_op_infix_minus_as_parameter.tla", line 12, character 6

    incomplete expression

    File "./infix_op_infix_minus_as_parameter.tla", line 12, character 6
    incomplete expression
    File "<unknown>":
    Error: Could not parse "./infix_op_infix_minus_as_parameter.tla" successfully.
     tlapm ending abnormally with Failure("Module.Parser.parse_file")
---*)

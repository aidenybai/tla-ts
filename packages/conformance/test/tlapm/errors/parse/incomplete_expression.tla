(*---
description: A binary operator with no right operand is an incomplete expression, so the module fails to parse.
ref: src/expr/e_parser.ml#expr
mode: obligations
outcome: rejected
---*)
---- MODULE incomplete_expression ----
THEOREM TRUE = OBVIOUS
====

(*--- recorded
all:
  exit: 3
  transcript: |-
    @type: warning
    @msg: File "./incomplete_expression.tla", line 8, character 8
    incomplete expression

    @type: warning
    @msg: File "./incomplete_expression.tla", line 8, character 8

    incomplete expression

    File "./incomplete_expression.tla", line 8, character 8
    incomplete expression
    File "<unknown>":
    Error: Could not parse "./incomplete_expression.tla" successfully.
     tlapm ending abnormally with Failure("Module.Parser.parse_file")
---*)

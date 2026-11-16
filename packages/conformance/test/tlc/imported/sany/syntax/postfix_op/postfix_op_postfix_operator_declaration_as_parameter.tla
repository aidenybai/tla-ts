(*---
description: Postfix Operator Declaration as Parameter. Ported from SANY's syntax corpus.
source: tlatools/org.lamport.tlatools/test/tla2sany/corpus/postfix_op.txt
features:
  - sany-syntax
outcome: parse-error
---*)
---- MODULE postfix_op_postfix_operator_declaration_as_parameter ----

op(
  _ ^+,
  _ ^*,
  _ ^#,
  _ '
) == 4

====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 14, col 3 to line 14, col 5 of module postfix_op_postfix_operator_declaration_as_parameter
    | Symbol ' is a built-in operator, and cannot be redefined.
    3002:1 Parsing or semantic analysis failed.
---*)

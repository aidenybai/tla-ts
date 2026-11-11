(*---
description: Postfix Operators as Parameters. Ported from SANY's syntax corpus.
source: tlatools/org.lamport.tlatools/test/tla2sany/corpus/postfix_op.txt
features:
  - sany-syntax
outcome: parse-error
---*)
---- MODULE postfix_op_postfix_operators_as_parameters ----
op == f(
  ^+,
  ^*,
  ^#,
  '
)
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 9, col 7 to line 9, col 7 of module postfix_op_postfix_operators_as_parameters
    | Unknown operator: `f'.
    3002:1 Parsing or semantic analysis failed.
---*)

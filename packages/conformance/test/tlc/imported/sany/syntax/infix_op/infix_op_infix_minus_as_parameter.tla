(*---
description: Infix Minus as Parameter. Ported from SANY's syntax corpus.
source: tlatools/org.lamport.tlatools/test/tla2sany/corpus/infix_op.txt
features:
  - sany-syntax
outcome: parse-error
---*)
---- MODULE infix_op_infix_minus_as_parameter ----
op == f ( - )
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 9, col 7 to line 9, col 7 of module infix_op_infix_minus_as_parameter
    | Unknown operator: `f'.
    3002:1 Parsing or semantic analysis failed.
---*)

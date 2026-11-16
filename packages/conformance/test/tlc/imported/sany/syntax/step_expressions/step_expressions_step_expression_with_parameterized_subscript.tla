(*---
description: Step Expression With Parameterized Subscript. Ported from SANY's syntax corpus.
source: tlatools/org.lamport.tlatools/test/tla2sany/corpus/step_expressions.txt
features:
  - sany-syntax
outcome: parse-error
---*)
---- MODULE step_expressions_step_expression_with_parameterized_subscript ----
op == [A]_M(S)!vars
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 2
    | line 9, col 8 to line 9, col 8 of module step_expressions_step_expression_with_parameterized_subscript
    | Unknown operator: `A'.
    | line 9, col 11 to line 9, col 19 of module step_expressions_step_expression_with_parameterized_subscript
    | Unknown operator: `M!vars'.
    3002:1 Parsing or semantic analysis failed.
---*)

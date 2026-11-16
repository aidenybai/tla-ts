(*---
description: Step Expression No Stuttering. Ported from SANY's syntax corpus.
source: tlatools/org.lamport.tlatools/test/tla2sany/corpus/step_expressions.txt
features:
  - sany-syntax
outcome: parse-error
---*)
---- MODULE step_expressions_step_expression_no_stuttering ----
op == <<A>>_<<x, y, z>>
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 4
    | line 9, col 9 to line 9, col 9 of module step_expressions_step_expression_no_stuttering
    | Unknown operator: `A'.
    | line 9, col 15 to line 9, col 15 of module step_expressions_step_expression_no_stuttering
    | Unknown operator: `x'.
    | line 9, col 18 to line 9, col 18 of module step_expressions_step_expression_no_stuttering
    | Unknown operator: `y'.
    | line 9, col 21 to line 9, col 21 of module step_expressions_step_expression_no_stuttering
    | Unknown operator: `z'.
    3002:1 Parsing or semantic analysis failed.
---*)

(*---
description: Step Expression Or Stuttering. Ported from SANY's syntax corpus.
source: tlatools/org.lamport.tlatools/test/tla2sany/corpus/step_expressions.txt
features:
  - sany-syntax
outcome: parse-error
---*)
---- MODULE step_expressions_step_expression_or_stuttering ----
op == [A]_<<x, y, z>>
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 4
    | line 9, col 8 to line 9, col 8 of module step_expressions_step_expression_or_stuttering
    | Unknown operator: `A'.
    | line 9, col 13 to line 9, col 13 of module step_expressions_step_expression_or_stuttering
    | Unknown operator: `x'.
    | line 9, col 16 to line 9, col 16 of module step_expressions_step_expression_or_stuttering
    | Unknown operator: `y'.
    | line 9, col 19 to line 9, col 19 of module step_expressions_step_expression_or_stuttering
    | Unknown operator: `z'.
    3002:1 Parsing or semantic analysis failed.
---*)

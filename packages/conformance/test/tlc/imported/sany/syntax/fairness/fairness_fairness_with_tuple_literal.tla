(*---
description: Fairness with Tuple Literal. Ported from SANY's syntax corpus.
source: tlatools/org.lamport.tlatools/test/tla2sany/corpus/fairness.txt
features:
  - sany-syntax
outcome: parse-error
---*)
---- MODULE fairness_fairness_with_tuple_literal ----
op == WF_<<x, y>>(f)
op == SF_x(f)
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | *** Warnings: 1
    | line 10, col 1 to line 10, col 13 of module fairness_fairness_with_tuple_literal
    | Multiple declarations or definitions for symbol op.  
    | This duplicates the one at line 9, col 1 to line 9, col 20 of module fairness_fairness_with_tuple_literal.
    | Semantic errors:
    | *** Errors: 6
    | line 9, col 12 to line 9, col 12 of module fairness_fairness_with_tuple_literal
    | Unknown operator: `x'.
    | line 9, col 15 to line 9, col 15 of module fairness_fairness_with_tuple_literal
    | Unknown operator: `y'.
    | line 9, col 19 to line 9, col 19 of module fairness_fairness_with_tuple_literal
    | Unknown operator: `f'.
    | line 10, col 1 to line 10, col 13 of module fairness_fairness_with_tuple_literal
    | Operator op already defined or declared.
    | line 10, col 10 to line 10, col 10 of module fairness_fairness_with_tuple_literal
    | Unknown operator: `x'.
    | line 10, col 12 to line 10, col 12 of module fairness_fairness_with_tuple_literal
    | Unknown operator: `f'.
    3002:1 Parsing or semantic analysis failed.
---*)

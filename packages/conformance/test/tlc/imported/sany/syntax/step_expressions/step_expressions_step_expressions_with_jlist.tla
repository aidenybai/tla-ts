(*---
description: Step Expressions with Jlist. Ported from SANY's syntax corpus.
source: tlatools/org.lamport.tlatools/test/tla2sany/corpus/step_expressions.txt
features:
  - sany-syntax
outcome: parse-error
---*)
---- MODULE step_expressions_step_expressions_with_jlist ----

op == [
  /\ 1
  /\ 2
    ]_x

op == <<
  /\ 1
  /\ 2
    >>_x

====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | *** Warnings: 1
    | line 15, col 1 to line 18, col 8 of module step_expressions_step_expressions_with_jlist
    | Multiple declarations or definitions for symbol op.  
    | This duplicates the one at line 10, col 1 to line 13, col 7 of module step_expressions_step_expressions_with_jlist.
    | Semantic errors:
    | *** Errors: 3
    | line 13, col 7 to line 13, col 7 of module step_expressions_step_expressions_with_jlist
    | Unknown operator: `x'.
    | line 15, col 1 to line 18, col 8 of module step_expressions_step_expressions_with_jlist
    | Operator op already defined or declared.
    | line 18, col 8 to line 18, col 8 of module step_expressions_step_expressions_with_jlist
    | Unknown operator: `x'.
    3002:1 Parsing or semantic analysis failed.
---*)

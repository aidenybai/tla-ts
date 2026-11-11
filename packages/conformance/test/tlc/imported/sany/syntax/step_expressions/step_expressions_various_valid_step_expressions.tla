(*---
description: Various Valid Step Expressions. Ported from SANY's syntax corpus.
source: tlatools/org.lamport.tlatools/test/tla2sany/corpus/step_expressions.txt
features:
  - sany-syntax
outcome: parse-error
---*)
---- MODULE step_expressions_various_valid_step_expressions ----
Prop == [][x = {1, 2}]_x
Prop == [][1 \in {1, 2}]_x
Prop == [][LET S == {1, 2} IN x \in S]_x
Prop == [][LET S == {1, 2} IN x \in {1, 2}]_x
Prop == [][TRUE /\ x \in {1, 2}]_x
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | *** Warnings: 4
    | line 10, col 1 to line 10, col 26 of module step_expressions_various_valid_step_expressions
    | Multiple declarations or definitions for symbol Prop.  
    | This duplicates the one at line 9, col 1 to line 9, col 24 of module step_expressions_various_valid_step_expressions.
    | line 11, col 1 to line 11, col 40 of module step_expressions_various_valid_step_expressions
    | Multiple declarations or definitions for symbol Prop.  
    | This duplicates the one at line 9, col 1 to line 9, col 24 of module step_expressions_various_valid_step_expressions.
    | line 12, col 1 to line 12, col 45 of module step_expressions_various_valid_step_expressions
    | Multiple declarations or definitions for symbol Prop.  
    | This duplicates the one at line 9, col 1 to line 9, col 24 of module step_expressions_various_valid_step_expressions.
    | line 13, col 1 to line 13, col 34 of module step_expressions_various_valid_step_expressions
    | Multiple declarations or definitions for symbol Prop.  
    | This duplicates the one at line 9, col 1 to line 9, col 24 of module step_expressions_various_valid_step_expressions.
    | Semantic errors:
    | *** Errors: 13
    | line 9, col 12 to line 9, col 12 of module step_expressions_various_valid_step_expressions
    | Unknown operator: `x'.
    | line 9, col 24 to line 9, col 24 of module step_expressions_various_valid_step_expressions
    | Unknown operator: `x'.
    | line 10, col 1 to line 10, col 26 of module step_expressions_various_valid_step_expressions
    | Operator Prop already defined or declared.
    | line 10, col 26 to line 10, col 26 of module step_expressions_various_valid_step_expressions
    | Unknown operator: `x'.
    | line 11, col 1 to line 11, col 40 of module step_expressions_various_valid_step_expressions
    | Operator Prop already defined or declared.
    | line 11, col 31 to line 11, col 31 of module step_expressions_various_valid_step_expressions
    | Unknown operator: `x'.
    | line 11, col 40 to line 11, col 40 of module step_expressions_various_valid_step_expressions
    | Unknown operator: `x'.
    | line 12, col 1 to line 12, col 45 of module step_expressions_various_valid_step_expressions
    | Operator Prop already defined or declared.
    | line 12, col 31 to line 12, col 31 of module step_expressions_various_valid_step_expressions
    | Unknown operator: `x'.
    | line 12, col 45 to line 12, col 45 of module step_expressions_various_valid_step_expressions
    | Unknown operator: `x'.
    | line 13, col 1 to line 13, col 34 of module step_expressions_various_valid_step_expressions
    | Operator Prop already defined or declared.
    | line 13, col 20 to line 13, col 20 of module step_expressions_various_valid_step_expressions
    | Unknown operator: `x'.
    | line 13, col 34 to line 13, col 34 of module step_expressions_various_valid_step_expressions
    | Unknown operator: `x'.
    3002:1 Parsing or semantic analysis failed.
---*)

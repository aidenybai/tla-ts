(*---
description: Minus and Negative. Ported from SANY's syntax corpus.
source: tlatools/org.lamport.tlatools/test/tla2sany/corpus/operators.txt
features:
  - sany-syntax
outcome: parse-error
---*)
---- MODULE operators_minus_and_negative ----
op == -. (1)
op == - (1)
op == - 1 - 2
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | *** Warnings: 2
    | line 10, col 1 to line 10, col 11 of module operators_minus_and_negative
    | Multiple declarations or definitions for symbol op.  
    | This duplicates the one at line 9, col 1 to line 9, col 12 of module operators_minus_and_negative.
    | line 11, col 1 to line 11, col 13 of module operators_minus_and_negative
    | Multiple declarations or definitions for symbol op.  
    | This duplicates the one at line 9, col 1 to line 9, col 12 of module operators_minus_and_negative.
    | Semantic errors:
    | *** Errors: 7
    | line 9, col 7 to line 9, col 8 of module operators_minus_and_negative
    | Unknown operator: `-.'.
    | line 10, col 1 to line 10, col 11 of module operators_minus_and_negative
    | Operator op already defined or declared.
    | line 10, col 7 to line 10, col 7 of module operators_minus_and_negative
    | Could not find declaration or definition of symbol '-.'.
    | line 10, col 7 to line 10, col 11 of module operators_minus_and_negative
    | Couldn't resolve prefix operator symbol `-.'.
    | line 11, col 1 to line 11, col 13 of module operators_minus_and_negative
    | Operator op already defined or declared.
    | line 11, col 11 to line 11, col 11 of module operators_minus_and_negative
    | Could not find declaration or definition of symbol '-'.
    | line 11, col 7 to line 11, col 13 of module operators_minus_and_negative
    | Couldn't resolve infix operator symbol `-'.
    3002:1 Parsing or semantic analysis failed.
---*)

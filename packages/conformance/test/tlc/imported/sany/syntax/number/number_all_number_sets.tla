(*---
description: All Number Sets. Ported from SANY's syntax corpus.
source: tlatools/org.lamport.tlatools/test/tla2sany/corpus/number.txt
features:
  - sany-syntax
outcome: parse-error
---*)
---- MODULE number_all_number_sets ----
op == Nat
op == Int
op == Real
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | *** Warnings: 2
    | line 10, col 1 to line 10, col 9 of module number_all_number_sets
    | Multiple declarations or definitions for symbol op.  
    | This duplicates the one at line 9, col 1 to line 9, col 9 of module number_all_number_sets.
    | line 11, col 1 to line 11, col 10 of module number_all_number_sets
    | Multiple declarations or definitions for symbol op.  
    | This duplicates the one at line 9, col 1 to line 9, col 9 of module number_all_number_sets.
    | Semantic errors:
    | *** Errors: 5
    | line 9, col 7 to line 9, col 9 of module number_all_number_sets
    | Unknown operator: `Nat'.
    | line 10, col 1 to line 10, col 9 of module number_all_number_sets
    | Operator op already defined or declared.
    | line 10, col 7 to line 10, col 9 of module number_all_number_sets
    | Unknown operator: `Int'.
    | line 11, col 1 to line 11, col 10 of module number_all_number_sets
    | Operator op already defined or declared.
    | line 11, col 7 to line 11, col 10 of module number_all_number_sets
    | Unknown operator: `Real'.
    3002:1 Parsing or semantic analysis failed.
---*)

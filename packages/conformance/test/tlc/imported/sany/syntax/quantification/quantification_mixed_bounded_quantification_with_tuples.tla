(*---
description: Mixed Bounded Quantification With Tuples. Ported from SANY's syntax corpus.
source: tlatools/org.lamport.tlatools/test/tla2sany/corpus/quantification.txt
features:
  - sany-syntax
outcome: parse-error
---*)
---- MODULE quantification_mixed_bounded_quantification_with_tuples ----
op == \A x, y \in Nat, <<z>> \in Int, a, b, c \in Real : FALSE
op == \E <<x, y>> \in Nat, a, b \in Int : TRUE
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | *** Warnings: 1
    | line 10, col 1 to line 10, col 46 of module quantification_mixed_bounded_quantification_with_tuples
    | Multiple declarations or definitions for symbol op.  
    | This duplicates the one at line 9, col 1 to line 9, col 62 of module quantification_mixed_bounded_quantification_with_tuples.
    | Semantic errors:
    | *** Errors: 6
    | line 9, col 19 to line 9, col 21 of module quantification_mixed_bounded_quantification_with_tuples
    | Unknown operator: `Nat'.
    | line 9, col 34 to line 9, col 36 of module quantification_mixed_bounded_quantification_with_tuples
    | Unknown operator: `Int'.
    | line 9, col 51 to line 9, col 54 of module quantification_mixed_bounded_quantification_with_tuples
    | Unknown operator: `Real'.
    | line 10, col 1 to line 10, col 46 of module quantification_mixed_bounded_quantification_with_tuples
    | Operator op already defined or declared.
    | line 10, col 23 to line 10, col 25 of module quantification_mixed_bounded_quantification_with_tuples
    | Unknown operator: `Nat'.
    | line 10, col 37 to line 10, col 39 of module quantification_mixed_bounded_quantification_with_tuples
    | Unknown operator: `Int'.
    3002:1 Parsing or semantic analysis failed.
---*)

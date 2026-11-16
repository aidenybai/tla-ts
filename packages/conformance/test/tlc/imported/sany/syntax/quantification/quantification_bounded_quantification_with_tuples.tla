(*---
description: Bounded Quantification With Tuples. Ported from SANY's syntax corpus.
source: tlatools/org.lamport.tlatools/test/tla2sany/corpus/quantification.txt
features:
  - sany-syntax
outcome: parse-error
---*)
---- MODULE quantification_bounded_quantification_with_tuples ----
op == \A <<x, y>> \in Nat, <<z>> \in Int, <<a, b, c>> \in Real : FALSE
op == \E <<x, y>> \in Nat, <<a, b>> \in Int : TRUE
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | *** Warnings: 1
    | line 10, col 1 to line 10, col 50 of module quantification_bounded_quantification_with_tuples
    | Multiple declarations or definitions for symbol op.  
    | This duplicates the one at line 9, col 1 to line 9, col 70 of module quantification_bounded_quantification_with_tuples.
    | Semantic errors:
    | *** Errors: 6
    | line 9, col 23 to line 9, col 25 of module quantification_bounded_quantification_with_tuples
    | Unknown operator: `Nat'.
    | line 9, col 38 to line 9, col 40 of module quantification_bounded_quantification_with_tuples
    | Unknown operator: `Int'.
    | line 9, col 59 to line 9, col 62 of module quantification_bounded_quantification_with_tuples
    | Unknown operator: `Real'.
    | line 10, col 1 to line 10, col 50 of module quantification_bounded_quantification_with_tuples
    | Operator op already defined or declared.
    | line 10, col 23 to line 10, col 25 of module quantification_bounded_quantification_with_tuples
    | Unknown operator: `Nat'.
    | line 10, col 41 to line 10, col 43 of module quantification_bounded_quantification_with_tuples
    | Unknown operator: `Int'.
    3002:1 Parsing or semantic analysis failed.
---*)

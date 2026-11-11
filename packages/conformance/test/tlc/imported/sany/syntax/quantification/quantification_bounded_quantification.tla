(*---
description: Bounded Quantification. Ported from SANY's syntax corpus.
source: tlatools/org.lamport.tlatools/test/tla2sany/corpus/quantification.txt
features:
  - sany-syntax
outcome: parse-error
---*)
---- MODULE quantification_bounded_quantification ----
op == \A x, y \in Nat, z \in Int, a, b, c \in Real : FALSE
op == \E x, y \in Nat, a, b \in Int : TRUE
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | *** Warnings: 1
    | line 10, col 1 to line 10, col 42 of module quantification_bounded_quantification
    | Multiple declarations or definitions for symbol op.  
    | This duplicates the one at line 9, col 1 to line 9, col 58 of module quantification_bounded_quantification.
    | Semantic errors:
    | *** Errors: 6
    | line 9, col 19 to line 9, col 21 of module quantification_bounded_quantification
    | Unknown operator: `Nat'.
    | line 9, col 30 to line 9, col 32 of module quantification_bounded_quantification
    | Unknown operator: `Int'.
    | line 9, col 47 to line 9, col 50 of module quantification_bounded_quantification
    | Unknown operator: `Real'.
    | line 10, col 1 to line 10, col 42 of module quantification_bounded_quantification
    | Operator op already defined or declared.
    | line 10, col 19 to line 10, col 21 of module quantification_bounded_quantification
    | Unknown operator: `Nat'.
    | line 10, col 33 to line 10, col 35 of module quantification_bounded_quantification
    | Unknown operator: `Int'.
    3002:1 Parsing or semantic analysis failed.
---*)

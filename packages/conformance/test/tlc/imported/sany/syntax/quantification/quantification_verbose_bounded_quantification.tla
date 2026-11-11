(*---
description: Verbose Bounded Quantification. Ported from SANY's syntax corpus.
source: tlatools/org.lamport.tlatools/test/tla2sany/corpus/quantification.txt
features:
  - sany-syntax
outcome: parse-error
---*)
---- MODULE quantification_verbose_bounded_quantification ----
op == \forall x, y \in Nat, z \in Int, a, b, c \in Real : FALSE
op == \exists x, y \in Nat, a, b \in Int : TRUE
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | *** Warnings: 1
    | line 10, col 1 to line 10, col 47 of module quantification_verbose_bounded_quantification
    | Multiple declarations or definitions for symbol op.  
    | This duplicates the one at line 9, col 1 to line 9, col 63 of module quantification_verbose_bounded_quantification.
    | Semantic errors:
    | *** Errors: 6
    | line 9, col 24 to line 9, col 26 of module quantification_verbose_bounded_quantification
    | Unknown operator: `Nat'.
    | line 9, col 35 to line 9, col 37 of module quantification_verbose_bounded_quantification
    | Unknown operator: `Int'.
    | line 9, col 52 to line 9, col 55 of module quantification_verbose_bounded_quantification
    | Unknown operator: `Real'.
    | line 10, col 1 to line 10, col 47 of module quantification_verbose_bounded_quantification
    | Operator op already defined or declared.
    | line 10, col 24 to line 10, col 26 of module quantification_verbose_bounded_quantification
    | Unknown operator: `Nat'.
    | line 10, col 38 to line 10, col 40 of module quantification_verbose_bounded_quantification
    | Unknown operator: `Int'.
    3002:1 Parsing or semantic analysis failed.
---*)

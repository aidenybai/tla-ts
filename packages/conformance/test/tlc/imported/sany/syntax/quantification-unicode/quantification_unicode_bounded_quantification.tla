(*---
description: Bounded Quantification. Ported from SANY's syntax corpus.
source: tlatools/org.lamport.tlatools/test/tla2sany/corpus/unicode/quantification-unicode.txt
features:
  - sany-syntax
outcome: parse-error
---*)
---- MODULE quantification_unicode_bounded_quantification ----
op ≜ ∀ x, y ∈ Nat, z ∈ Int, ⟨a, b, c⟩ ∈ Real : FALSE
op ≜ ∃ ⟨x, y⟩ ∈ Nat, a, b ∈ Int : TRUE
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | *** Warnings: 1
    | line 10, col 1 to line 10, col 38 of module quantification_unicode_bounded_quantification
    | Multiple declarations or definitions for symbol op.  
    | This duplicates the one at line 9, col 1 to line 9, col 52 of module quantification_unicode_bounded_quantification.
    | Semantic errors:
    | *** Errors: 6
    | line 9, col 15 to line 9, col 17 of module quantification_unicode_bounded_quantification
    | Unknown operator: `Nat'.
    | line 9, col 24 to line 9, col 26 of module quantification_unicode_bounded_quantification
    | Unknown operator: `Int'.
    | line 9, col 41 to line 9, col 44 of module quantification_unicode_bounded_quantification
    | Unknown operator: `Real'.
    | line 10, col 1 to line 10, col 38 of module quantification_unicode_bounded_quantification
    | Operator op already defined or declared.
    | line 10, col 17 to line 10, col 19 of module quantification_unicode_bounded_quantification
    | Unknown operator: `Nat'.
    | line 10, col 29 to line 10, col 31 of module quantification_unicode_bounded_quantification
    | Unknown operator: `Int'.
    3002:1 Parsing or semantic analysis failed.
---*)

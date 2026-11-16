(*---
description: Bounded CHOOSE. Ported from SANY's syntax corpus.
source: tlatools/org.lamport.tlatools/test/tla2sany/corpus/unicode/quantification-unicode.txt
features:
  - sany-syntax
outcome: parse-error
---*)
---- MODULE quantification_unicode_bounded_choose ----
op ≜ CHOOSE x ∈ Nat : TRUE
op ≜ CHOOSE ⟨x, y, z⟩ ∈ S : FALSE
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | *** Warnings: 1
    | line 10, col 1 to line 10, col 33 of module quantification_unicode_bounded_choose
    | Multiple declarations or definitions for symbol op.  
    | This duplicates the one at line 9, col 1 to line 9, col 26 of module quantification_unicode_bounded_choose.
    | Semantic errors:
    | *** Errors: 3
    | line 9, col 17 to line 9, col 19 of module quantification_unicode_bounded_choose
    | Unknown operator: `Nat'.
    | line 10, col 1 to line 10, col 33 of module quantification_unicode_bounded_choose
    | Operator op already defined or declared.
    | line 10, col 25 to line 10, col 25 of module quantification_unicode_bounded_choose
    | Unknown operator: `S'.
    3002:1 Parsing or semantic analysis failed.
---*)

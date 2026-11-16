(*---
description: Unbounded CHOOSE. Ported from SANY's syntax corpus.
source: tlatools/org.lamport.tlatools/test/tla2sany/corpus/unicode/quantification-unicode.txt
features:
  - sany-syntax
outcome: parse-error
---*)
---- MODULE quantification_unicode_unbounded_choose ----
op ≜ CHOOSE x : TRUE
op ≜ CHOOSE ⟨x, y, z⟩ : FALSE
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | *** Warnings: 1
    | line 10, col 1 to line 10, col 29 of module quantification_unicode_unbounded_choose
    | Multiple declarations or definitions for symbol op.  
    | This duplicates the one at line 9, col 1 to line 9, col 20 of module quantification_unicode_unbounded_choose.
    | Semantic errors:
    | *** Errors: 1
    | line 10, col 1 to line 10, col 29 of module quantification_unicode_unbounded_choose
    | Operator op already defined or declared.
    3002:1 Parsing or semantic analysis failed.
---*)

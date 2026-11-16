(*---
description: Unbounded Quantification. Ported from SANY's syntax corpus.
source: tlatools/org.lamport.tlatools/test/tla2sany/corpus/unicode/quantification-unicode.txt
features:
  - sany-syntax
outcome: parse-error
---*)
---- MODULE quantification_unicode_unbounded_quantification ----
op ≜ ∀ x : TRUE
op ≜ ∃ x, y : FALSE
op ≜ \AA x, y, z : TRUE
op ≜ \EE x, y, z, w : FALSE
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | *** Warnings: 3
    | line 10, col 1 to line 10, col 19 of module quantification_unicode_unbounded_quantification
    | Multiple declarations or definitions for symbol op.  
    | This duplicates the one at line 9, col 1 to line 9, col 15 of module quantification_unicode_unbounded_quantification.
    | line 11, col 1 to line 11, col 23 of module quantification_unicode_unbounded_quantification
    | Multiple declarations or definitions for symbol op.  
    | This duplicates the one at line 9, col 1 to line 9, col 15 of module quantification_unicode_unbounded_quantification.
    | line 12, col 1 to line 12, col 27 of module quantification_unicode_unbounded_quantification
    | Multiple declarations or definitions for symbol op.  
    | This duplicates the one at line 9, col 1 to line 9, col 15 of module quantification_unicode_unbounded_quantification.
    | Semantic errors:
    | *** Errors: 3
    | line 10, col 1 to line 10, col 19 of module quantification_unicode_unbounded_quantification
    | Operator op already defined or declared.
    | line 11, col 1 to line 11, col 23 of module quantification_unicode_unbounded_quantification
    | Operator op already defined or declared.
    | line 12, col 1 to line 12, col 27 of module quantification_unicode_unbounded_quantification
    | Operator op already defined or declared.
    3002:1 Parsing or semantic analysis failed.
---*)

(*---
description: Unicode Number Sets. Ported from SANY's syntax corpus.
source: tlatools/org.lamport.tlatools/test/tla2sany/corpus/unicode/numbers-unicode.txt
features:
  - sany-syntax
outcome: parse-error
---*)
---- MODULE numbers_unicode_unicode_number_sets ----
ℕ ≜ {}
op ≜ A!ℕ
ℤ ≜ {}
op ≜ A!ℤ
ℝ ≜ {}
op ≜ A!ℝ
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | *** Warnings: 2
    | line 12, col 1 to line 12, col 8 of module numbers_unicode_unicode_number_sets
    | Multiple declarations or definitions for symbol op.  
    | This duplicates the one at line 10, col 1 to line 10, col 8 of module numbers_unicode_unicode_number_sets.
    | line 14, col 1 to line 14, col 8 of module numbers_unicode_unicode_number_sets
    | Multiple declarations or definitions for symbol op.  
    | This duplicates the one at line 10, col 1 to line 10, col 8 of module numbers_unicode_unicode_number_sets.
    | Semantic errors:
    | *** Errors: 5
    | line 10, col 6 to line 10, col 8 of module numbers_unicode_unicode_number_sets
    | Unknown operator: `A!ℕ'.
    | line 12, col 1 to line 12, col 8 of module numbers_unicode_unicode_number_sets
    | Operator op already defined or declared.
    | line 12, col 6 to line 12, col 8 of module numbers_unicode_unicode_number_sets
    | Unknown operator: `A!ℤ'.
    | line 14, col 1 to line 14, col 8 of module numbers_unicode_unicode_number_sets
    | Operator op already defined or declared.
    | line 14, col 6 to line 14, col 8 of module numbers_unicode_unicode_number_sets
    | Unknown operator: `A!ℝ'.
    3002:1 Parsing or semantic analysis failed.
---*)

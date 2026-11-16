(*---
description: Set Filter with Tuple. Ported from SANY's syntax corpus.
source: tlatools/org.lamport.tlatools/test/tla2sany/corpus/unicode/sets-unicode.txt
features:
  - sany-syntax
outcome: parse-error
---*)
---- MODULE sets_unicode_set_filter_with_tuple ----
op ≜ {⟨x, y, z⟩ ∈ ℕ × ℤ × ℝ : P(x, y, z)}
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 4
    | line 9, col 19 to line 9, col 19 of module sets_unicode_set_filter_with_tuple
    | Unknown operator: `ℕ'.
    | line 9, col 23 to line 9, col 23 of module sets_unicode_set_filter_with_tuple
    | Unknown operator: `ℤ'.
    | line 9, col 27 to line 9, col 27 of module sets_unicode_set_filter_with_tuple
    | Unknown operator: `ℝ'.
    | line 9, col 31 to line 9, col 31 of module sets_unicode_set_filter_with_tuple
    | Unknown operator: `P'.
    3002:1 Parsing or semantic analysis failed.
---*)

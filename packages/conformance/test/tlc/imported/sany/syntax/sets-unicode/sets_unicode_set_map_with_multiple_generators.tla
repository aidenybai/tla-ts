(*---
description: Set Map with Multiple Generators. Ported from SANY's syntax corpus.
source: tlatools/org.lamport.tlatools/test/tla2sany/corpus/unicode/sets-unicode.txt
features:
  - sany-syntax
outcome: parse-error
---*)
---- MODULE sets_unicode_set_map_with_multiple_generators ----
op ≜ {f(x, y, z) : x ∈ ℤ, y, z ∈ ℝ}
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 3
    | line 9, col 24 to line 9, col 24 of module sets_unicode_set_map_with_multiple_generators
    | Unknown operator: `ℤ'.
    | line 9, col 34 to line 9, col 34 of module sets_unicode_set_map_with_multiple_generators
    | Unknown operator: `ℝ'.
    | line 9, col 7 to line 9, col 7 of module sets_unicode_set_map_with_multiple_generators
    | Unknown operator: `f'.
    3002:1 Parsing or semantic analysis failed.
---*)

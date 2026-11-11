(*---
description: Set Map. Ported from SANY's syntax corpus.
source: tlatools/org.lamport.tlatools/test/tla2sany/corpus/unicode/sets-unicode.txt
features:
  - sany-syntax
outcome: parse-error
---*)
---- MODULE sets_unicode_set_map ----
op ≜ {f(x) : x ∈ ℕ}
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 2
    | line 9, col 18 to line 9, col 18 of module sets_unicode_set_map
    | Unknown operator: `ℕ'.
    | line 9, col 7 to line 9, col 7 of module sets_unicode_set_map
    | Unknown operator: `f'.
    3002:1 Parsing or semantic analysis failed.
---*)

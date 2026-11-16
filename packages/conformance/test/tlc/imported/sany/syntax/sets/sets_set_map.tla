(*---
description: Set Map. Ported from SANY's syntax corpus.
source: tlatools/org.lamport.tlatools/test/tla2sany/corpus/sets.txt
features:
  - sany-syntax
outcome: parse-error
---*)
---- MODULE sets_set_map ----
op == {f(x) : x \in Nat}
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 2
    | line 9, col 21 to line 9, col 23 of module sets_set_map
    | Unknown operator: `Nat'.
    | line 9, col 8 to line 9, col 8 of module sets_set_map
    | Unknown operator: `f'.
    3002:1 Parsing or semantic analysis failed.
---*)

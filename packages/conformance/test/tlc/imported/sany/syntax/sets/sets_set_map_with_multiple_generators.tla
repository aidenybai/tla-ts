(*---
description: Set Map with Multiple Generators. Ported from SANY's syntax corpus.
source: tlatools/org.lamport.tlatools/test/tla2sany/corpus/sets.txt
features:
  - sany-syntax
outcome: parse-error
---*)
---- MODULE sets_set_map_with_multiple_generators ----
op == {f(x, y, z) : x \in Int, y, z \in Real}
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 3
    | line 9, col 27 to line 9, col 29 of module sets_set_map_with_multiple_generators
    | Unknown operator: `Int'.
    | line 9, col 41 to line 9, col 44 of module sets_set_map_with_multiple_generators
    | Unknown operator: `Real'.
    | line 9, col 8 to line 9, col 8 of module sets_set_map_with_multiple_generators
    | Unknown operator: `f'.
    3002:1 Parsing or semantic analysis failed.
---*)

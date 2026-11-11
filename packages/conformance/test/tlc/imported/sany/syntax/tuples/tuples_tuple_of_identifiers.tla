(*---
description: Tuple of Identifiers. Ported from SANY's syntax corpus.
source: tlatools/org.lamport.tlatools/test/tla2sany/corpus/tuples.txt
features:
  - sany-syntax
outcome: parse-error
---*)
---- MODULE tuples_tuple_of_identifiers ----
op == <<x, y, z>> 
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 3
    | line 9, col 9 to line 9, col 9 of module tuples_tuple_of_identifiers
    | Unknown operator: `x'.
    | line 9, col 12 to line 9, col 12 of module tuples_tuple_of_identifiers
    | Unknown operator: `y'.
    | line 9, col 15 to line 9, col 15 of module tuples_tuple_of_identifiers
    | Unknown operator: `z'.
    3002:1 Parsing or semantic analysis failed.
---*)

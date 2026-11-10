(*---
description: Set of Records. Ported from SANY's syntax corpus.
source: tlatools/org.lamport.tlatools/test/tla2sany/corpus/records.txt
features:
  - sany-syntax
outcome: parse-error
---*)
---- MODULE records_set_of_records ----
op == [
  foo : Nat,
  bar : Int,
  baz : Real
]
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 3
    | line 10, col 9 to line 10, col 11 of module records_set_of_records
    | Unknown operator: `Nat'.
    | line 11, col 9 to line 11, col 11 of module records_set_of_records
    | Unknown operator: `Int'.
    | line 12, col 9 to line 12, col 12 of module records_set_of_records
    | Unknown operator: `Real'.
    3002:1 Parsing or semantic analysis failed.
---*)

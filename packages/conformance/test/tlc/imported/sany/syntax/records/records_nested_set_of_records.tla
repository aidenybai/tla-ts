(*---
description: Nested Set of Records. Ported from SANY's syntax corpus.
source: tlatools/org.lamport.tlatools/test/tla2sany/corpus/records.txt
features:
  - sany-syntax
outcome: parse-error
---*)
---- MODULE records_nested_set_of_records ----
op == [
  foo : [
    foo : Nat,
    bar : Int,
    baz : Real
  ],
  bar : Int,
  baz : Real
]
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 5
    | line 11, col 11 to line 11, col 13 of module records_nested_set_of_records
    | Unknown operator: `Nat'.
    | line 12, col 11 to line 12, col 13 of module records_nested_set_of_records
    | Unknown operator: `Int'.
    | line 13, col 11 to line 13, col 14 of module records_nested_set_of_records
    | Unknown operator: `Real'.
    | line 15, col 9 to line 15, col 11 of module records_nested_set_of_records
    | Unknown operator: `Int'.
    | line 16, col 9 to line 16, col 12 of module records_nested_set_of_records
    | Unknown operator: `Real'.
    3002:1 Parsing or semantic analysis failed.
---*)

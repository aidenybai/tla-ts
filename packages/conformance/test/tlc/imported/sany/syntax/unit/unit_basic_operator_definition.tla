(*---
description: Basic Operator Definition. Ported from SANY's syntax corpus.
source: tlatools/org.lamport.tlatools/test/tla2sany/corpus/unit.txt
features:
  - sany-syntax
outcome: parse-error
---*)
---- MODULE unit_basic_operator_definition ----
op == f(10)
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 9, col 7 to line 9, col 7 of module unit_basic_operator_definition
    | Unknown operator: `f'.
    3002:1 Parsing or semantic analysis failed.
---*)

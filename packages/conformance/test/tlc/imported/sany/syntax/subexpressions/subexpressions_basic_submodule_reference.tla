(*---
description: Basic Submodule Reference. Ported from SANY's syntax corpus.
source: tlatools/org.lamport.tlatools/test/tla2sany/corpus/subexpressions.txt
features:
  - sany-syntax
outcome: parse-error
---*)
---- MODULE subexpressions_basic_submodule_reference ----
op == M!X!Y!Z
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 9, col 7 to line 9, col 13 of module subexpressions_basic_submodule_reference
    | Unknown operator: `M!X!Y!Z'.
    3002:1 Parsing or semantic analysis failed.
---*)

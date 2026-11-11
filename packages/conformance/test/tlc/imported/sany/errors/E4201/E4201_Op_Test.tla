(*---
description: SANY reports E4201. Ported from SANY's error corpus.
source: tlatools/org.lamport.tlatools/test/tla2sany/semantic/error_corpus/E4201_Op_Test.tla
features:
  - sany-errors
outcome: parse-error
---*)
If a symbol is already defined, its name cannot be re-used as an operator.
---- MODULE E4201_Op_Test ----
op == 0
op == 0
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | *** Warnings: 1
    | line 11, col 1 to line 11, col 7 of module E4201_Op_Test
    | Multiple declarations or definitions for symbol op.  
    | This duplicates the one at line 10, col 1 to line 10, col 7 of module E4201_Op_Test.
    | Semantic errors:
    | *** Errors: 1
    | line 11, col 1 to line 11, col 7 of module E4201_Op_Test
    | Operator op already defined or declared.
    3002:1 Parsing or semantic analysis failed.
---*)

(*---
description: SANY reports E4292. Ported from SANY's error corpus.
source: tlatools/org.lamport.tlatools/test/tla2sany/semantic/error_corpus/E4292_1_Expected_2_Provided_Test.tla
features:
  - sany-errors
outcome: parse-error
---*)
A recursive operator's definition must have the same arity as its declaration
following the RECURSIVE keyword.
---- MODULE E4292_1_Expected_2_Provided_Test ----
RECURSIVE op(_)
op(x, y) == 0
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 12, col 1 to line 12, col 13 of module E4292_1_Expected_2_Provided_Test
    | Definition of op has different arity than its RECURSIVE declaration.
    3002:1 Parsing or semantic analysis failed.
---*)

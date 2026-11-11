(*---
description: SANY reports E4292. Ported from SANY's error corpus.
source: tlatools/org.lamport.tlatools/test/tla2sany/semantic/error_corpus/E4292_Function_Test.tla
features:
  - sany-errors
outcome: parse-error
---*)
A recursive operator's definition must have the same arity as its declaration
following the RECURSIVE keyword.
---- MODULE E4292_Function_Test ----
RECURSIVE F(_)
F[x \in {}] == 0
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 2
    | line 12, col 1 to line 12, col 16 of module E4292_Function_Test
    | Function F has operator arguments in its RECURSIVE declaration.
    | line 11, col 11 to line 11, col 14 of module E4292_Function_Test
    | Symbol F declared in RECURSIVE statement but not defined.
    3002:1 Parsing or semantic analysis failed.
---*)

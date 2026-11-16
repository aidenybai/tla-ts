(*---
description: SANY reports E4206. Ported from SANY's error corpus.
source: tlatools/org.lamport.tlatools/test/tla2sany/semantic/error_corpus/E4206_Test.tla
features:
  - sany-errors
outcome: parse-error
---*)
Assumptions must be constant-level.
---- MODULE E4206_Test ----
VARIABLE v
ASSUME v
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 11, col 1 to line 11, col 8 of module E4206_Test
    | Level error: assumptions must be level 0 (Constant), 
    | but this one has level 1.
    3002:1 Parsing or semantic analysis failed.
---*)

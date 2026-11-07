(*---
description: SANY reports E4291. Ported from SANY's error corpus.
source: tlatools/org.lamport.tlatools/test/tla2sany/semantic/error_corpus/E4291_Test.tla
features:
  - sany-errors
outcome: parse-error
---*)
It is an error if a recursive operator is declared but not defined.
---- MODULE E4291_Test ----
RECURSIVE op
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 10, col 11 to line 10, col 12 of module E4291_Test
    | Symbol op declared in RECURSIVE statement but not defined.
    3002:1 Parsing or semantic analysis failed.
---*)

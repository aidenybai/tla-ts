(*---
description: SANY reports E4356. Ported from SANY's error corpus.
source: tlatools/org.lamport.tlatools/test/tla2sany/semantic/error_corpus/E4356_Test.tla
features:
  - sany-errors
outcome: parse-error
---*)
When introducing a new constant in an ASSUME/PROVE block, if a set bound is
given then that set bound cannot be of temporal level.
---- MODULE E4356_Test ----
VARIABLE v
THEOREM
  ASSUME NEW x \in []v
  PROVE TRUE
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 13, col 10 to line 13, col 22 of module E4356_Test
    | Level error:
    | Temporal formula used as set.
    3002:1 Parsing or semantic analysis failed.
---*)

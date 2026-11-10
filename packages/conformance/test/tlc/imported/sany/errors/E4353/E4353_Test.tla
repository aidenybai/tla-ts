(*---
description: SANY reports E4353. Ported from SANY's error corpus.
source: tlatools/org.lamport.tlatools/test/tla2sany/semantic/error_corpus/E4353_Test.tla
features:
  - sany-errors
outcome: parse-error
---*)
If a proof goal is of temporal level, CASE steps must have constant level.
---- MODULE E4353_Test ----
VARIABLE v
THEOREM []v
PROOF
<1> CASE v
<1> QED
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 13, col 5 to line 13, col 10 of module E4353_Test
    | Non-constant CASE for temporal goal.
    3002:1 Parsing or semantic analysis failed.
---*)

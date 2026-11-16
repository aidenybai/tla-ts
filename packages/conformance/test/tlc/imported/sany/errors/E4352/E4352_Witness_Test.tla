(*---
description: SANY reports E4352. Ported from SANY's error corpus.
source: tlatools/org.lamport.tlatools/test/tla2sany/semantic/error_corpus/E4352_Witness_Test.tla
features:
  - sany-errors
outcome: parse-error
---*)
If a proof goal is of temporal level, WITNESS steps must have constant level.
---- MODULE E4352_Witness_Test ----
VARIABLE v
THEOREM []v
PROOF
<1> WITNESS v
<1> QED
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 13, col 5 to line 13, col 13 of module E4352_Witness_Test
    | Non-constant TAKE, WITNESS, or HAVE for temporal goal.
    3002:1 Parsing or semantic analysis failed.
---*)

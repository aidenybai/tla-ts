(*---
description: SANY reports E4315. Ported from SANY's error corpus.
source: tlatools/org.lamport.tlatools/test/tla2sany/semantic/error_corpus/E4315_Existential_Test.tla
features:
  - sany-errors
outcome: parse-error
---*)
Quantification cannot have a temporal-level bound.
---- MODULE E4315_Existential_Test ----
VARIABLE v
op == \E x \in []v : TRUE
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 11, col 7 to line 11, col 25 of module E4315_Existential_Test
    | Level error in applying operator $BoundedExists:
    | The level of the range for the bounded variable line 11, col 10 to line 11, col 10 of module E4315_Existential_Test 
    | exceeds the maximum level allowed by the operator.
    3002:1 Parsing or semantic analysis failed.
---*)

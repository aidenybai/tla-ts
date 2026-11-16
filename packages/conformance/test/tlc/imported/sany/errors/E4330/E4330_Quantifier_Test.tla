(*---
description: SANY reports E4330. Ported from SANY's error corpus.
source: tlatools/org.lamport.tlatools/test/tla2sany/semantic/error_corpus/E4330_Quantifier_Test.tla
features:
  - sany-errors
outcome: parse-error
---*)
Label parameters are required if labels occur within the scope of bound
identifiers, but these parameters should obey common-sense restrictions like
not defining the same parameter twice.
---- MODULE E4330_Quantifier_Test ----
op == \A x \in {} : lbl(x, x) :: TRUE
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 12, col 21 to line 12, col 37 of module E4330_Quantifier_Test
    | Repeated formal parameter x 
    | in label `lbl'.
    3002:1 Parsing or semantic analysis failed.
---*)

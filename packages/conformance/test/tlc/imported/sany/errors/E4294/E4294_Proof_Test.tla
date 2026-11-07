(*---
description: SANY reports E4294. Ported from SANY's error corpus.
source: tlatools/org.lamport.tlatools/test/tla2sany/semantic/error_corpus/E4294_Proof_Test.tla
features:
  - sany-errors
outcome: parse-error
---*)
Proofs cannot occur in between the declaration of a recursive operator and
its definition.
---- MODULE E4294_Proof_Test ----
RECURSIVE op
THEOREM TRUE
PROOF OBVIOUS
op == 0
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 12, col 1 to line 13, col 13 of module E4294_Proof_Test
    | A THEOREM may not appear within a recursive definition section.
    3002:1 Parsing or semantic analysis failed.
---*)

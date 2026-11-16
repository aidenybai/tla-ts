(*---
description: Proof by QED. Ported from SANY's syntax corpus.
source: tlatools/org.lamport.tlatools/test/tla2sany/corpus/proofs.txt
features:
  - sany-syntax
outcome: parse-error
---*)
---- MODULE proofs_proof_by_qed ----
COROLLARY TRUE
PROOF <1>a QED BY <1>a, <1>b
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 10, col 25 to line 10, col 28 of module proofs_proof_by_qed
    | Unknown operator: `<1>b'.
    3002:1 Parsing or semantic analysis failed.
---*)

(*---
description: Stepped Proof by Definition. Ported from SANY's syntax corpus.
source: tlatools/org.lamport.tlatools/test/tla2sany/corpus/proofs.txt
features:
  - sany-syntax
outcome: parse-error
---*)
---- MODULE proofs_stepped_proof_by_definition ----
PROPOSITION P => Q
PROOF
  <1> P
  <1> Q
    PROOF BY P
  <1> QED
=====================

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 5
    | line 9, col 13 to line 9, col 13 of module proofs_stepped_proof_by_definition
    | Unknown operator: `P'.
    | line 9, col 18 to line 9, col 18 of module proofs_stepped_proof_by_definition
    | Unknown operator: `Q'.
    | line 11, col 7 to line 11, col 7 of module proofs_stepped_proof_by_definition
    | Unknown operator: `P'.
    | line 12, col 7 to line 12, col 7 of module proofs_stepped_proof_by_definition
    | Unknown operator: `Q'.
    | line 13, col 14 to line 13, col 14 of module proofs_stepped_proof_by_definition
    | Unknown operator: `P'.
    3002:1 Parsing or semantic analysis failed.
---*)

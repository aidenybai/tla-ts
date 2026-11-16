(*---
description: Proof by Multiple Definitions. Ported from SANY's syntax corpus.
source: tlatools/org.lamport.tlatools/test/tla2sany/corpus/proofs.txt
features:
  - sany-syntax
outcome: parse-error
---*)
---- MODULE proofs_proof_by_multiple_definitions ----
LEMMA TRUE
PROOF BY ONLY
  P,
  Q
  DEFS
    >,
    R,
    =
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 7
    | line 11, col 3 to line 11, col 3 of module proofs_proof_by_multiple_definitions
    | Unknown operator: `P'.
    | line 12, col 3 to line 12, col 3 of module proofs_proof_by_multiple_definitions
    | Unknown operator: `Q'.
    | line 14, col 5 to line 14, col 5 of module proofs_proof_by_multiple_definitions
    | Unknown operator: `>'.
    | line 14, col 5 to line 14, col 5 of module proofs_proof_by_multiple_definitions
    | DEF clause entry should describe a defined operator.
    | line 15, col 5 to line 15, col 5 of module proofs_proof_by_multiple_definitions
    | Unknown operator: `R'.
    | line 15, col 5 to line 15, col 5 of module proofs_proof_by_multiple_definitions
    | DEF clause entry should describe a defined operator.
    | line 16, col 5 to line 16, col 5 of module proofs_proof_by_multiple_definitions
    | DEF clause entry should describe a defined operator.
    3002:1 Parsing or semantic analysis failed.
---*)

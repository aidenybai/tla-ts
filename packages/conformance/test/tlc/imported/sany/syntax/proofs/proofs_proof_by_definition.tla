(*---
description: Proof by Definition. Ported from SANY's syntax corpus.
source: tlatools/org.lamport.tlatools/test/tla2sany/corpus/proofs.txt
features:
  - sany-syntax
outcome: parse-error
---*)
---- MODULE proofs_proof_by_definition ----
PROPOSITION TRUE
PROOF BY DEF >
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 3
    | line 10, col 14 to line 10, col 14 of module proofs_proof_by_definition
    | Unknown operator: `>'.
    | line 10, col 14 to line 10, col 14 of module proofs_proof_by_definition
    | DEF clause entry should describe a defined operator.
    | line 10, col 1 to line 10, col 14 of module proofs_proof_by_definition
    | Empty BY
    3002:1 Parsing or semantic analysis failed.
---*)

(*---
description: Proof by Module References. Ported from SANY's syntax corpus.
source: tlatools/org.lamport.tlatools/test/tla2sany/corpus/proofs.txt
features:
  - sany-syntax
outcome: parse-error
---*)
---- MODULE proofs_proof_by_module_references ----
LEMMA TRUE
PROOF BY ONLY
  MODULE Naturals,
  MODULE Integers
  DEFS
    MODULE Reals,
    MODULE Sequences
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 5
    | line 11, col 10 to line 11, col 17 of module proofs_proof_by_module_references
    | Module `Naturals' used without being extended or instantiated.
    | line 12, col 10 to line 12, col 17 of module proofs_proof_by_module_references
    | Module `Integers' used without being extended or instantiated.
    | line 14, col 12 to line 14, col 16 of module proofs_proof_by_module_references
    | Module `Reals' used without being extended or instantiated.
    | line 15, col 12 to line 15, col 20 of module proofs_proof_by_module_references
    | Module `Sequences' used without being extended or instantiated.
    | line 10, col 1 to line 15, col 20 of module proofs_proof_by_module_references
    | Empty BY
    3002:1 Parsing or semantic analysis failed.
---*)

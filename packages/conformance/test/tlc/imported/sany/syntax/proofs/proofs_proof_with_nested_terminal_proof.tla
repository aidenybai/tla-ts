(*---
description: Proof with Nested Terminal Proof. Ported from SANY's syntax corpus.
source: tlatools/org.lamport.tlatools/test/tla2sany/corpus/proofs.txt
features:
  - sany-syntax
outcome: parse-error
---*)
---- MODULE proofs_proof_with_nested_terminal_proof ----
LEMMA TRUE
PROOF
<*> 1
  <+> 2
  <1> QED
    PROOF BY P
<*> 3
  <+> 4
  <1> QED
    OBVIOUS
<*> 5
  <+> 6
  <1> QED
    PROOF OMITTED
<*> 7
<0> QED
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 14, col 14 to line 14, col 14 of module proofs_proof_with_nested_terminal_proof
    | Unknown operator: `P'.
    3002:1 Parsing or semantic analysis failed.
---*)

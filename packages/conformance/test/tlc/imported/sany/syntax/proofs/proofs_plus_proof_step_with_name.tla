(*---
description: Plus Proof Step With Name. Ported from SANY's syntax corpus.
source: tlatools/org.lamport.tlatools/test/tla2sany/corpus/proofs.txt
features:
  - sany-syntax
outcome: parse-error
---*)
---- MODULE proofs_plus_proof_step_with_name ----
THEOREM TRUE
<1>abc 1
  <+>def 2
  <2>ghi QED
<1>jkl QED
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 11, col 3 to line 11, col 8 of module proofs_plus_proof_step_with_name
    | <*> and <+> cannot be used for a named step.
    3002:1 Parsing or semantic analysis failed.
---*)

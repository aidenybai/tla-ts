(*---
description: Implicit Proof Steps With Names. Ported from SANY's syntax corpus.
source: tlatools/org.lamport.tlatools/test/tla2sany/corpus/proofs.txt
features:
  - sany-syntax
outcome: parse-error
---*)
---- MODULE proofs_implicit_proof_steps_with_names ----
THEOREM TRUE
<*>abc 1
<*>def QED
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 2
    | line 10, col 1 to line 10, col 6 of module proofs_implicit_proof_steps_with_names
    | <*> and <+> cannot be used for a named step.
    | line 11, col 1 to line 11, col 6 of module proofs_implicit_proof_steps_with_names
    | <*> and <+> cannot be used for a named step.
    3002:1 Parsing or semantic analysis failed.
---*)

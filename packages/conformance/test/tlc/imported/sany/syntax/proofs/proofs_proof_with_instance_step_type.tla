(*---
description: Proof with INSTANCE step type. Ported from SANY's syntax corpus.
source: tlatools/org.lamport.tlatools/test/tla2sany/corpus/proofs.txt
features:
  - sany-syntax
outcome: parse-error
---*)
---- MODULE proofs_proof_with_instance_step_type ----
THEOREM TRUE
<1>a..... INSTANCE M
<1>b..... QED
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Fatal errors while parsing TLA+ spec in file proofs_proof_with_instance_step_type
    | In module proofs_proof_with_instance_step_type
    | Cannot find source file for module M imported in module proofs_proof_with_instance_step_type.
    | *** Errors: 1
    | In module proofs_proof_with_instance_step_type
    | Cannot find source file for module M imported in module proofs_proof_with_instance_step_type.
    3002:1 Parsing or semantic analysis failed.
---*)

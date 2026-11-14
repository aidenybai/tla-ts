(*---
description: The syntax corpus case "Stepped Proof by Definition" in proofs.txt, which tlapm's parser tests read.
ref: test/parser/syntax_corpus/proofs.txt
features:
  - tlapm-test
  - syntax-corpus
mode: obligations
outcome: rejected
---*)
---- MODULE proofs_stepped_proof_by_definition ----
EXTENDS TestPrelude
PROPOSITION P => Q
PROOF
  <1> P
  <1> Q
    PROOF BY P
  <1> QED
=====================
---- MODULE TestPrelude ----
VARIABLES P, Q
====

(*--- recorded
all:
  exit: 3
  transcript: |-
    @type: warning
    @msg: File "./proofs_stepped_proof_by_definition.tla", line 11, characters 9-19

    Unknown module "TestPrelude"

    File "./proofs_stepped_proof_by_definition.tla", line 11, characters 9-19:
    Error: Unknown module "TestPrelude"
     tlapm ending abnormally with Failure("Module.Parser.load_module")
---*)

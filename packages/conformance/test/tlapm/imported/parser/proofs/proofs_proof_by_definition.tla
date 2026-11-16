(*---
description: The syntax corpus case "Proof by Definition" in proofs.txt, which tlapm's parser tests read.
ref: test/parser/syntax_corpus/proofs.txt
features:
  - tlapm-test
  - syntax-corpus
mode: obligations
outcome: rejected
---*)
---- MODULE proofs_proof_by_definition ----
EXTENDS TestPrelude
PROPOSITION TRUE
PROOF BY DEF >
====
---- MODULE TestPrelude ----
x > y == TRUE
====

(*--- recorded
all:
  exit: 3
  transcript: |-
    @type: warning
    @msg: File "./proofs_proof_by_definition.tla", line 11, characters 9-19

    Unknown module "TestPrelude"

    File "./proofs_proof_by_definition.tla", line 11, characters 9-19:
    Error: Unknown module "TestPrelude"
     tlapm ending abnormally with Failure("Module.Parser.load_module")
---*)

(*---
description: The syntax corpus case "Pick Proof Steps" in proofs.txt, which tlapm's parser tests read.
ref: test/parser/syntax_corpus/proofs.txt
features:
  - tlapm-test
  - syntax-corpus
mode: obligations
outcome: rejected
---*)
---- MODULE proofs_pick_proof_steps ----
EXTENDS TestPrelude
THEOREM TRUE
<1> PICK x1 : TRUE
<1> PICK x2, y2, z2 : TRUE
<1> PICK x3 \in S : TRUE
<1> PICK x4, y4, z4 \in S : TRUE
<1> PICK x5 \in S, y5 \in S, z5 \in S : TRUE
<1> PICK u, v, w \in S, x6, y6 \in S, z6 \in S : TRUE
<1> QED
====
---- MODULE TestPrelude ----
VARIABLE S
====

(*--- recorded
all:
  exit: 3
  transcript: |-
    @type: warning
    @msg: File "./proofs_pick_proof_steps.tla", line 11, characters 9-19

    Unknown module "TestPrelude"

    File "./proofs_pick_proof_steps.tla", line 11, characters 9-19:
    Error: Unknown module "TestPrelude"
     tlapm ending abnormally with Failure("Module.Parser.load_module")
---*)

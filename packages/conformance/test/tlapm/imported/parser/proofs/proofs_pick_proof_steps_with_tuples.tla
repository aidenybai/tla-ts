(*---
description: The syntax corpus case "Pick Proof Steps With Tuples" in proofs.txt, which tlapm's parser tests read.
ref: test/parser/syntax_corpus/proofs.txt
features:
  - tlapm-test
  - syntax-corpus
mode: obligations
outcome: rejected
---*)
---- MODULE proofs_pick_proof_steps_with_tuples ----
EXTENDS TestPrelude
THEOREM TRUE
<1> PICK <<x1>> \in S : TRUE
<1> PICK <<x2, y2, z2>> \in S : TRUE
<1> PICK <<x3>> \in S, <<y3, z3>> \in S : TRUE
<1> QED
====
---- MODULE TestPrelude ----
VARIABLE S
====

(*--- recorded
all:
  exit: 3
  transcript: |-
    @type: error
    @url: http://tla.msr-inria.inria.fr/bugs
    @msg: Oops, this seems to be a bug in TLAPM.
    Please give feedback to developers.


     Failure("use instead the class `P_visit.map_concrete`")

     tlapm ending abnormally with Failure("use instead the class `P_visit.map_concrete`")
---*)

(*---
description: The syntax corpus case "Proof Steps With Terminal Proofs" in proofs.txt, which tlapm's parser tests read.
ref: test/parser/syntax_corpus/proofs.txt
features:
  - tlapm-test
  - syntax-corpus
mode: obligations
outcome: rejected
---*)
---- MODULE proofs_proof_steps_with_terminal_proofs ----
EXTENDS TestPrelude
THEOREM TRUE
<1> SUFFICES TRUE OBVIOUS
<1> TRUE OBVIOUS
<1> CASE TRUE OBVIOUS
<1> PICK x1 : TRUE OBVIOUS
<1> PICK <<x2>> \in S : TRUE OBVIOUS
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

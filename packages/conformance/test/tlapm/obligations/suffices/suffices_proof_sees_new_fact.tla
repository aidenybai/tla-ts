(*---
description: In the proof of a SUFFICES step, the step's sequent is a visible fact, so the obligation proves the old goal from it.
ref: src/proof/p_gen.ml#use_assertion
args: ["--debug", "alldefs"]
mode: obligations
outcome: proved
---*)
---- MODULE suffices_proof_sees_new_fact ----
CONSTANT A, B
THEOREM A \/ B
<1>1. SUFFICES A
  OBVIOUS
<1> QED
  OBVIOUS
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    @type: obligation
    @id: 1
    @loc: 14:3:14:10
    @status: to be proved
    @obl: ASSUME NEW CONSTANT A,
           NEW CONSTANT B,
           (* from proof *)
           <1>1 == TRUE
    PROVE  A

    @type: obligation
    @id: 2
    @loc: 12:3:12:10
    @status: to be proved
    @obl: ASSUME NEW CONSTANT A,
           NEW CONSTANT B,
           (* from proof *)
           <1>1 == A,
           <1>1 
    PROVE  A \/ B

    @type: obligationsnumber
    @count: 2
---*)

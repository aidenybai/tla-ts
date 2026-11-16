(*---
description: With --debug hidden, a numbered CASE step's proof has the assumption hidden, a hidden TRUE, the step defined as the assumption, and its hidden fact.
ref: src/proof/p_gen.ml#prove_assertion
args: ["--debug", "hidden"]
mode: obligations
outcome: proved
---*)
---- MODULE case_named_debug ----
CONSTANT A, B
THEOREM B
<1>1. CASE A
  OBVIOUS
<1> QED
  BY <1>1
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    @type: obligation
    @id: 1
    @loc: 14:3:14:5
    @status: to be proved
    @obl: ASSUME NEW CONSTANT A,
           NEW CONSTANT B,
           <1>1 == ASSUME A 
                   PROVE  B,
           (* hidden *)
           <1>1 ,
           <1>1 
    PROVE  B

    @type: obligation
    @id: 2
    @loc: 14:6:14:10
    @status: to be proved
    @obl: ASSUME NEW CONSTANT A,
           NEW CONSTANT B,
           <1>1 == ASSUME A 
                   PROVE  B,
           (* hidden *)
           <1>1 
    PROVE  <1>1

    @type: obligation
    @id: 3
    @loc: 12:3:12:10
    @status: to be proved
    @obl: ASSUME NEW CONSTANT A,
           NEW CONSTANT B,
           (* hidden *)
           A ,
           (* hidden *)
           TRUE ,
           <1>1 == A,
           (* hidden *)
           <1>1 
    PROVE  B

    @type: obligationsnumber
    @count: 3
---*)

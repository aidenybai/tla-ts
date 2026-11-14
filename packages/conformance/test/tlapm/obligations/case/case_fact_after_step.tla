(*---
description: After an unnumbered CASE step, the later steps have its fact, ASSUME A PROVE goal, visible under a generated name.
ref: src/proof/p_gen.ml#use_assertion
args: ["--debug", "alldefs"]
mode: obligations
outcome: proved
---*)
---- MODULE case_fact_after_step ----
CONSTANT A, B
THEOREM B
<1> CASE A
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
           <1>_a3 == ASSUME A 
                     PROVE  B,
           <1>_a3 
    PROVE  B

    @type: obligation
    @id: 2
    @loc: 12:3:12:10
    @status: to be proved
    @obl: ASSUME NEW CONSTANT A,
           NEW CONSTANT B,
           A ,
           (* from proof *)
           <1>_a3 == A
    PROVE  B

    @type: obligationsnumber
    @count: 2
---*)

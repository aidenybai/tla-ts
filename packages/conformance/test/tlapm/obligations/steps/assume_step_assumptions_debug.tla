(*---
description: With --debug hidden, a numbered ASSUME step's own proof has its assumptions hidden, then a hidden TRUE, the step's definition and its hidden fact.
ref: src/proof/p_gen.ml#prove_assertion
args: ["--debug", "hidden"]
mode: obligations
outcome: proved
---*)
---- MODULE assume_step_assumptions_debug ----
CONSTANT P(_)
THEOREM \A x : P(x) => P(x)
<1>1. ASSUME NEW y, P(y) PROVE P(y)
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
    @obl: ASSUME NEW CONSTANT P(_),
           <1>1 == ASSUME NEW CONSTANT y,
                          P(y) 
                   PROVE  P(y),
           (* hidden *)
           <1>1 ,
           <1>1 
    PROVE  \A x : P(x) => P(x)

    @type: obligation
    @id: 2
    @loc: 14:6:14:10
    @status: to be proved
    @obl: ASSUME NEW CONSTANT P(_),
           <1>1 == ASSUME NEW CONSTANT y,
                          P(y) 
                   PROVE  P(y),
           (* hidden *)
           <1>1 
    PROVE  <1>1

    @type: obligation
    @id: 3
    @loc: 12:3:12:10
    @status: to be proved
    @obl: ASSUME NEW CONSTANT P(_),
           NEW CONSTANT y,
           (* hidden *)
           P(y) ,
           (* hidden *)
           TRUE ,
           <1>1 == P(y),
           (* hidden *)
           <1>1 
    PROVE  P(y)

    @type: obligationsnumber
    @count: 3
---*)

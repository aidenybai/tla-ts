(*---
description: With --debug hidden, the steps after a numbered SUFFICES see its assumption hidden, then a hidden TRUE, the step's definition and its hidden fact.
ref: src/proof/p_gen.ml#prove_assertion
args: ["--debug", "hidden"]
mode: obligations
outcome: proved
---*)
---- MODULE suffices_debug_hidden ----
CONSTANT P(_)
THEOREM \A x : P(x) => P(x)
<1>1. SUFFICES ASSUME NEW y, P(y) PROVE P(y)
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

    @type: obligation
    @id: 2
    @loc: 12:3:12:10
    @status: to be proved
    @obl: ASSUME NEW CONSTANT P(_),
           <1>1 == ASSUME NEW CONSTANT y,
                          P(y) 
                   PROVE  P(y),
           <1>1 
    PROVE  \A x : P(x) => P(x)

    @type: obligationsnumber
    @count: 2
---*)

(*---
description: With --debug hidden, the steps after a numbered PICK see the predicate hidden next to the generated SUFFICES.
ref: src/proof/p_simplify.ml#simplify_step
args: ["--debug", "hidden"]
mode: obligations
outcome: proved
---*)
---- MODULE pick_named_debug ----
CONSTANT P(_)
THEOREM ASSUME \E x : P(x) PROVE TRUE
<1>1. PICK y : P(y)
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
           \E x : P(x) ,
           <1>1ex2 == \E y : P(y),
           (* hidden *)
           <1>1ex2 ,
           NEW CONSTANT y,
           (* hidden *)
           P(y) ,
           (* hidden *)
           TRUE ,
           <1>1 == P(y),
           (* hidden *)
           <1>1 
    PROVE  TRUE

    @type: obligation
    @id: 2
    @loc: 12:3:12:10
    @status: to be proved
    @obl: ASSUME NEW CONSTANT P(_),
           \E x : P(x) ,
           (* hidden *)
           TRUE ,
           <1>1ex2 == TRUE,
           (* hidden *)
           <1>1ex2 
    PROVE  \E y : P(y)

    @type: obligationsnumber
    @count: 2
---*)

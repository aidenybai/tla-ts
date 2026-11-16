(*---
description: The fact of an unnumbered ASSUME step is visible in later steps under a generated name, whose definition --debug alldefs prints as the whole sequent.
ref: src/proof/p_gen.ml#use_assertion
args: ["--debug", "alldefs"]
mode: obligations
outcome: proved
---*)
---- MODULE anonymous_assume_step_fact_sequent ----
CONSTANT P(_)
THEOREM \A x : P(x) => P(x)
<1> ASSUME NEW y, P(y) PROVE P(y)
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
           (* from proof *)
           <1>_a3 == ASSUME NEW CONSTANT y,
                            P(y) 
                     PROVE  P(y),
           <1>_a3 
    PROVE  \A x : P(x) => P(x)

    @type: obligation
    @id: 2
    @loc: 12:3:12:10
    @status: to be proved
    @obl: ASSUME NEW CONSTANT P(_),
           NEW CONSTANT y,
           P(y) ,
           (* from proof *)
           <1>_a3 == P(y)
    PROVE  P(y)

    @type: obligationsnumber
    @count: 2
---*)

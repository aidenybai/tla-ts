(*---
description: WITNESS on a goal that is not existential gives an error obligation that prints the goal.
ref: src/proof/p_simplify.ml#simplify_step
mode: obligations
outcome: proved
---*)
---- MODULE witness_not_existential ----
CONSTANT P(_)
THEOREM P(1)
<1> WITNESS 1
<1> QED
  OBVIOUS
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    @type: obligation
    @id: 1
    @loc: 12:3:12:10
    @status: to be proved
    @obl: ASSUME NEW CONSTANT P(_)
    PROVE  P(1)

    @type: obligation
    @id: 2
    @loc: 10:1:10:14
    @status: to be proved
    @obl: 
    Error: this WITNESS step is applied to the following goal,
    which is not an existential formula:
      P(1)

    @type: obligationsnumber
    @count: 2
---*)

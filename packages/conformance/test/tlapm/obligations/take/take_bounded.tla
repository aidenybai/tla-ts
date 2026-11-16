(*---
description: "TAKE x \\in S on a goal \\A x \\in S : P(x) declares the constant with its bound, and the later steps prove the body."
ref: src/proof/p_simplify.ml#simplify_step
mode: obligations
outcome: proved
---*)
---- MODULE take_bounded ----
CONSTANT P(_), S
THEOREM \A x \in S : P(x)
<1> TAKE y \in S
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
    @obl: ASSUME NEW CONSTANT P(_),
           NEW CONSTANT S,
           NEW CONSTANT y \in S
    PROVE  P(y)

    @type: obligation
    @id: 2
    @loc: 10:1:10:17
    @status: to be proved
    @obl: ASSUME NEW CONSTANT P(_),
           NEW CONSTANT S,
           <1>_a3 
    PROVE  \A x \in S : P(x)

    @type: obligation
    @id: 3
    @loc: 10:1:10:17
    @status: to be proved
    @obl: ASSUME NEW CONSTANT P(_),
           NEW CONSTANT S,
           <1>_a3 
    PROVE  <1>_a3

    @type: obligationsnumber
    @count: 3
---*)

(*---
description: TAKE x \in T on a goal bounded by S adds S \subseteq T as a fact and a support obligation.
ref: src/proof/p_simplify.ml#simplify_step
mode: obligations
outcome: proved
---*)
---- MODULE take_different_domain ----
CONSTANT P(_), S, T
THEOREM \A x \in S : P(x)
<1> TAKE y \in T
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
           NEW CONSTANT T,
           NEW CONSTANT y \in T
    PROVE  P(y)

    @type: obligation
    @id: 2
    @loc: 10:1:10:17
    @status: to be proved
    @obl: ASSUME NEW CONSTANT P(_),
           NEW CONSTANT S,
           NEW CONSTANT T,
           <1>_a3 ,
           S \subseteq T 
    PROVE  \A x \in S : P(x)

    @type: obligation
    @id: 3
    @loc: 10:1:10:17
    @status: to be proved
    @obl: ASSUME NEW CONSTANT P(_),
           NEW CONSTANT S,
           NEW CONSTANT T,
           <1>_a3 
    PROVE  <1>_a3

    @type: obligation
    @id: 4
    @loc: 10:10:10:11
    @status: to be proved
    @obl: ASSUME NEW CONSTANT P(_),
           NEW CONSTANT S,
           NEW CONSTANT T,
           <1>_a3 ,
           <1>_a3 
    PROVE  S \subseteq T

    @type: obligationsnumber
    @count: 4
---*)

(*---
description: WITNESS e \in S on a goal bounded by S adds the membership as a fact, with obligations that prove it.
ref: src/proof/p_simplify.ml#simplify_step
mode: obligations
outcome: proved
---*)
---- MODULE witness_bounded_same_domain ----
CONSTANT P(_), S
THEOREM \E x \in S : P(x)
<1> WITNESS 1 \in S
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
           NEW CONSTANT S
    PROVE  P(1)

    @type: obligation
    @id: 2
    @loc: 10:1:10:20
    @status: to be proved
    @obl: ASSUME NEW CONSTANT P(_),
           NEW CONSTANT S,
           <1>_a3 ,
           <2>_a4 
    PROVE  \E x \in S : P(x)

    @type: obligation
    @id: 3
    @loc: 10:1:10:20
    @status: to be proved
    @obl: ASSUME NEW CONSTANT P(_),
           NEW CONSTANT S,
           <1>_a3 ,
           <2>_a4 
    PROVE  <1>_a3

    @type: obligation
    @id: 4
    @loc: 10:1:10:20
    @status: to be proved
    @obl: ASSUME NEW CONSTANT P(_),
           NEW CONSTANT S,
           <1>_a3 ,
           <2>_a4 ,
           <1>_a3 
    PROVE  <2>_a4

    @type: obligation
    @id: 5
    @loc: 10:13:10:20
    @status: to be proved
    @obl: ASSUME NEW CONSTANT P(_),
           NEW CONSTANT S,
           <1>_a3 ,
           1 \in S 
    PROVE  1 \in S

    @type: obligation
    @id: 6
    @loc: 10:13:10:20
    @status: to be proved
    @obl: ASSUME NEW CONSTANT P(_),
           NEW CONSTANT S,
           <1>_a3 
    PROVE  1 \in S

    @type: obligationsnumber
    @count: 6
---*)

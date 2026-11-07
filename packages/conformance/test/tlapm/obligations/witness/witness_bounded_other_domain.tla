(*---
description: WITNESS e \in T on a goal bounded by S also needs T \subseteq S, with its own obligations.
ref: src/proof/p_simplify.ml#simplify_step
mode: obligations
outcome: proved
---*)
---- MODULE witness_bounded_other_domain ----
CONSTANT P(_), S, T
THEOREM \E x \in S : P(x)
<1> WITNESS 1 \in T
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
           NEW CONSTANT T
    PROVE  P(1)

    @type: obligation
    @id: 2
    @loc: 10:1:10:20
    @status: to be proved
    @obl: ASSUME NEW CONSTANT P(_),
           NEW CONSTANT S,
           NEW CONSTANT T,
           <1>_a3 ,
           <2>_a4 ,
           <2>_a6 
    PROVE  \E x \in S : P(x)

    @type: obligation
    @id: 3
    @loc: 10:1:10:20
    @status: to be proved
    @obl: ASSUME NEW CONSTANT P(_),
           NEW CONSTANT S,
           NEW CONSTANT T,
           <1>_a3 ,
           <2>_a4 ,
           <2>_a6 
    PROVE  <1>_a3

    @type: obligation
    @id: 4
    @loc: 10:1:10:20
    @status: to be proved
    @obl: ASSUME NEW CONSTANT P(_),
           NEW CONSTANT S,
           NEW CONSTANT T,
           <1>_a3 ,
           <2>_a4 ,
           <2>_a6 ,
           <1>_a3 
    PROVE  <2>_a4

    @type: obligation
    @id: 5
    @loc: 10:1:10:20
    @status: to be proved
    @obl: ASSUME NEW CONSTANT P(_),
           NEW CONSTANT S,
           NEW CONSTANT T,
           <1>_a3 ,
           <2>_a4 ,
           <2>_a6 ,
           <1>_a3 ,
           <2>_a4 
    PROVE  <2>_a6

    @type: obligation
    @id: 6
    @loc: 10:19:10:20
    @status: to be proved
    @obl: ASSUME NEW CONSTANT P(_),
           NEW CONSTANT S,
           NEW CONSTANT T,
           <1>_a3 ,
           T \subseteq S 
    PROVE  T \subseteq S

    @type: obligation
    @id: 7
    @loc: 10:19:10:20
    @status: to be proved
    @obl: ASSUME NEW CONSTANT P(_),
           NEW CONSTANT S,
           NEW CONSTANT T,
           <1>_a3 
    PROVE  T \subseteq S

    @type: obligation
    @id: 8
    @loc: 10:13:10:20
    @status: to be proved
    @obl: ASSUME NEW CONSTANT P(_),
           NEW CONSTANT S,
           NEW CONSTANT T,
           <1>_a3 ,
           <2>_a4 ,
           1 \in T 
    PROVE  1 \in T

    @type: obligation
    @id: 9
    @loc: 10:13:10:20
    @status: to be proved
    @obl: ASSUME NEW CONSTANT P(_),
           NEW CONSTANT S,
           NEW CONSTANT T,
           <1>_a3 ,
           <2>_a4 
    PROVE  1 \in T

    @type: obligationsnumber
    @count: 9
---*)

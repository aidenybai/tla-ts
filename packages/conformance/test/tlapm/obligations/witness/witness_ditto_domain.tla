(*---
description: WITNESS on \E x, y \in S keeps the shared domain for the second variable.
ref: src/proof/p_simplify.ml#simplify_step
mode: obligations
outcome: proved
---*)
---- MODULE witness_ditto_domain ----
CONSTANT P(_, _), S
THEOREM \E x, y \in S : P(x, y)
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
    @obl: ASSUME NEW CONSTANT P(_, _),
           NEW CONSTANT S
    PROVE  \E y \in S : P(1, y)

    @type: obligation
    @id: 2
    @loc: 10:1:10:20
    @status: to be proved
    @obl: ASSUME NEW CONSTANT P(_, _),
           NEW CONSTANT S,
           <1>_a3 ,
           <2>_a4 
    PROVE  \E x, y \in S : P(x, y)

    @type: obligation
    @id: 3
    @loc: 10:1:10:20
    @status: to be proved
    @obl: ASSUME NEW CONSTANT P(_, _),
           NEW CONSTANT S,
           <1>_a3 ,
           <2>_a4 
    PROVE  <1>_a3

    @type: obligation
    @id: 4
    @loc: 10:1:10:20
    @status: to be proved
    @obl: ASSUME NEW CONSTANT P(_, _),
           NEW CONSTANT S,
           <1>_a3 ,
           <2>_a4 ,
           <1>_a3 
    PROVE  <2>_a4

    @type: obligation
    @id: 5
    @loc: 10:13:10:20
    @status: to be proved
    @obl: ASSUME NEW CONSTANT P(_, _),
           NEW CONSTANT S,
           <1>_a3 ,
           1 \in S 
    PROVE  1 \in S

    @type: obligation
    @id: 6
    @loc: 10:13:10:20
    @status: to be proved
    @obl: ASSUME NEW CONSTANT P(_, _),
           NEW CONSTANT S,
           <1>_a3 
    PROVE  1 \in S

    @type: obligationsnumber
    @count: 6
---*)

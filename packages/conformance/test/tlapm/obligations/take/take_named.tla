(*---
description: A numbered TAKE step is cited by its name, and the citation's support obligation proves the name.
ref: src/proof/p_simplify.ml#simplify_step
mode: obligations
outcome: proved
---*)
---- MODULE take_named ----
CONSTANT P(_)
THEOREM \A x : P(x)
<1>1. TAKE y
<1> QED
  BY <1>1
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    @type: obligation
    @id: 1
    @loc: 12:3:12:5
    @status: to be proved
    @obl: ASSUME NEW CONSTANT P(_),
           NEW CONSTANT y,
           <1>1 
    PROVE  P(y)

    @type: obligation
    @id: 2
    @loc: 12:6:12:10
    @status: to be proved
    @obl: ASSUME NEW CONSTANT P(_),
           NEW CONSTANT y
    PROVE  <1>1

    @type: obligation
    @id: 3
    @loc: 10:1:10:13
    @status: to be proved
    @obl: ASSUME NEW CONSTANT P(_),
           <1>1 
    PROVE  \A x : P(x)

    @type: obligation
    @id: 4
    @loc: 10:1:10:13
    @status: to be proved
    @obl: ASSUME NEW CONSTANT P(_),
           <1>1 
    PROVE  <1>1

    @type: obligationsnumber
    @count: 4
---*)

(*---
description: HAVE sees an implication under a prime, pushing the prime into both sides.
ref: src/proof/p_simplify.ml#expose_connective
mode: obligations
outcome: proved
---*)
---- MODULE have_through_prime ----
VARIABLE x
THEOREM (x = 0 => x = 0)'
<1> HAVE x' = 0
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
    @obl: ASSUME NEW VARIABLE x,
           x' = 0 
    PROVE  (x = 0)'

    @type: obligation
    @id: 2
    @loc: 10:1:10:16
    @status: to be proved
    @obl: ASSUME NEW VARIABLE x,
           <1>_a3 
    PROVE  (x = 0 => x = 0)'

    @type: obligation
    @id: 3
    @loc: 10:1:10:16
    @status: to be proved
    @obl: ASSUME NEW VARIABLE x,
           <1>_a3 
    PROVE  <1>_a3

    @type: obligationsnumber
    @count: 3
---*)

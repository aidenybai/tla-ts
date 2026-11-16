(*---
description: A suppressed USE step gives no support obligation, but its fact is still added to the context.
ref: src/proof/p_gen.ml#collect
mode: obligations
outcome: proved
---*)
---- MODULE suppressed_use_step ----
THEOREM TRUE
<1> (*{_}*) USE TRUE
<1> QED
  OBVIOUS
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    @type: obligation
    @id: 1
    @loc: 11:3:11:10
    @status: to be proved
    @obl: ASSUME TRUE 
    PROVE  TRUE

    @type: obligationsnumber
    @count: 1
---*)

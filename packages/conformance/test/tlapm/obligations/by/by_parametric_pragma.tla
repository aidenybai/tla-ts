(*---
description: A parametric backend pragma such as IsaM("auto") prints with its argument.
ref: src/proof/p_simplify.ml#simplify
mode: obligations
outcome: proved
---*)
---- MODULE by_parametric_pragma ----
EXTENDS TLAPS
THEOREM TRUE
  BY IsaM("auto")
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    @type: obligation
    @id: 1
    @loc: 10:3:10:5
    @status: to be proved
    @obl: ASSUME IsaM("auto") 
    PROVE  TRUE

    @type: obligation
    @id: 2
    @loc: 10:6:10:18
    @status: to be proved
    @obl: IsaM("auto")

    @type: obligationsnumber
    @count: 2
---*)

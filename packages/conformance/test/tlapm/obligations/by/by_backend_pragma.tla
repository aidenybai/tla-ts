(*---
description: A backend pragma such as Zenon from TLAPS is cited like a fact, and gives its own support obligation.
ref: src/proof/p_simplify.ml#simplify
mode: obligations
outcome: proved
---*)
---- MODULE by_backend_pragma ----
EXTENDS TLAPS
THEOREM TRUE
  BY Zenon
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    @type: obligation
    @id: 1
    @loc: 10:3:10:5
    @status: to be proved
    @obl: ASSUME Zenon 
    PROVE  TRUE

    @type: obligation
    @id: 2
    @loc: 10:6:10:11
    @status: to be proved
    @obl: Zenon

    @type: obligationsnumber
    @count: 2
---*)

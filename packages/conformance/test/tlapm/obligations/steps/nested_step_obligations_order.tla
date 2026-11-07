(*---
description: Obligations of a nested proof come after those of the QED of the enclosing proof and before those of later sibling steps in the enclosing proof.
ref: src/proof/p_gen.ml#collect
mode: obligations
outcome: proved
---*)
---- MODULE nested_step_obligations_order ----
THEOREM TRUE
<1>1. TRUE
  <2>1. TRUE
    OBVIOUS
  <2> QED
    OBVIOUS
<1>2. TRUE
  OBVIOUS
<1> QED
  OBVIOUS
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    @type: obligation
    @id: 1
    @loc: 17:3:17:10
    @status: to be proved
    @obl: TRUE

    @type: obligation
    @id: 2
    @loc: 13:5:13:12
    @status: to be proved
    @obl: TRUE

    @type: obligation
    @id: 3
    @loc: 11:5:11:12
    @status: to be proved
    @obl: TRUE

    @type: obligation
    @id: 4
    @loc: 15:3:15:10
    @status: to be proved
    @obl: TRUE

    @type: obligationsnumber
    @count: 4
---*)

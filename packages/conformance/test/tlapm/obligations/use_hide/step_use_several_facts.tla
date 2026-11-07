(*---
description: A USE step with several facts gives one support obligation per fact, each seeing the facts before it.
ref: src/proof/p_simplify.ml#simplify_step
mode: obligations
outcome: proved
---*)
---- MODULE step_use_several_facts ----
CONSTANT c
THEOREM c = c
<1> USE 1 = 1, 2 = 2
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
    @obl: ASSUME NEW CONSTANT c,
           1 = 1 ,
           2 = 2 
    PROVE  c = c

    @type: obligation
    @id: 2
    @loc: 10:9:10:14
    @status: to be proved
    @obl: ASSUME NEW CONSTANT c
    PROVE  1 = 1

    @type: obligation
    @id: 3
    @loc: 10:16:10:21
    @status: to be proved
    @obl: ASSUME NEW CONSTANT c,
           1 = 1 
    PROVE  2 = 2

    @type: obligationsnumber
    @count: 3
---*)

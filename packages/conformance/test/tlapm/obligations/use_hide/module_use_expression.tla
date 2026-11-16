(*---
description: A module-level USE of an expression gives a support obligation that proves the expression.
ref: src/proof/p_gen.ml#mutate
mode: obligations
outcome: proved
---*)
---- MODULE module_use_expression ----
CONSTANT c
USE c = c
THEOREM TRUE
  OBVIOUS
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    @type: obligation
    @id: 1
    @loc: 9:1:9:4
    @status: to be proved
    @obl: ASSUME NEW CONSTANT c
    PROVE  c = c

    @type: obligation
    @id: 2
    @loc: 11:3:11:10
    @status: to be proved
    @obl: ASSUME NEW CONSTANT c,
           c = c 
    PROVE  TRUE

    @type: obligationsnumber
    @count: 2
---*)

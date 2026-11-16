(*---
description: A module-level HIDE of a used fact hides it again in later theorems, and gives no obligation.
ref: src/proof/p_gen.ml#set_expr
mode: obligations
outcome: proved
---*)
---- MODULE module_hide_fact ----
CONSTANT c
AXIOM A == c = 1
USE A
HIDE A
THEOREM c = 1
  OBVIOUS
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    @type: obligation
    @id: 1
    @loc: 10:1:10:4
    @status: to be proved
    @obl: ASSUME NEW CONSTANT c,
           A == c = 1
    PROVE  A

    @type: obligation
    @id: 2
    @loc: 13:3:13:10
    @status: to be proved
    @obl: ASSUME NEW CONSTANT c,
           A == c = 1
    PROVE  c = 1

    @type: obligationsnumber
    @count: 2
---*)

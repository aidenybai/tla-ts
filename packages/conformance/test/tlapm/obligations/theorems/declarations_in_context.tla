(*---
description: Module-level CONSTANT and VARIABLE declarations appear in each obligation's context as NEW CONSTANT and NEW VARIABLE, in declaration order.
ref: src/module/m_t.ml#hyps_of_modunit
mode: obligations
outcome: proved
---*)
---- MODULE declarations_in_context ----
CONSTANT c
VARIABLE x
CONSTANTS d, e
VARIABLES y
THEOREM c = c
  OBVIOUS
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    @type: obligation
    @id: 1
    @loc: 13:3:13:10
    @status: to be proved
    @obl: ASSUME NEW CONSTANT c,
           NEW VARIABLE x,
           NEW CONSTANT d,
           NEW CONSTANT e,
           NEW VARIABLE y
    PROVE  c = c

    @type: obligationsnumber
    @count: 1
---*)

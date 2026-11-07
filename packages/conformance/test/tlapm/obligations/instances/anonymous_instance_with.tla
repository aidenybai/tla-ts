(*---
description: An unnamed INSTANCE with a substitution brings in definitions with the parameters replaced.
ref: src/module/m_elab.ml#normalize
includes: [Lib.tla]
mode: obligations
outcome: proved
---*)
---- MODULE anonymous_instance_with ----
CONSTANT c
VARIABLE x
INSTANCE Lib WITH k <- c, v <- x
THEOREM Op(c)
  BY DEF Op
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    @type: obligation
    @id: 1
    @loc: 13:3:13:5
    @status: to be proved
    @obl: ASSUME NEW CONSTANT c,
           NEW VARIABLE x,
           Op(a) == a = c
    PROVE  Op(c)

    @type: obligationsnumber
    @count: 1
---*)

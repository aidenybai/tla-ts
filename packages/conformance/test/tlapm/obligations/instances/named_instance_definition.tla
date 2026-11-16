(*---
description: DEF of I!Op for a named instance makes the substituted definition visible, printed as I!Op.
ref: src/module/m_elab.ml#instantiate
includes: [Lib.tla]
mode: obligations
outcome: proved
---*)
---- MODULE named_instance_definition ----
CONSTANT c
VARIABLE x
I == INSTANCE Lib WITH k <- c, v <- x
THEOREM I!Op(c)
  BY DEF I!Op
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
           I!Op(a) == a = c
    PROVE  I!Op(c)

    @type: obligationsnumber
    @count: 1
---*)

(*---
description: A LOCAL named instance is used like a public one within the module.
ref: src/module/m_parser.ml#modunit
includes: [Lib.tla]
mode: obligations
outcome: proved
---*)
---- MODULE local_instance ----
CONSTANT c
VARIABLE x
LOCAL I == INSTANCE Lib WITH k <- c, v <- x
THEOREM I!Op(c)
  BY I!LA DEF I!Op
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
           I!Op(a) == a = c,
           I!LA 
    PROVE  I!Op(c)

    @type: obligation
    @id: 2
    @loc: 13:6:13:10
    @status: to be proved
    @obl: ASSUME NEW CONSTANT c,
           NEW VARIABLE x,
           I!Op(a) == a = c
    PROVE  I!LA

    @type: obligationsnumber
    @count: 2
---*)

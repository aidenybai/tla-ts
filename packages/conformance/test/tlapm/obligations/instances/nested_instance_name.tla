(*---
description: Names of a module instantiated inside an instantiated module are reached as I!J!Op.
ref: src/module/m_elab.ml#instantiate
includes: [Lib.tla, Outer.tla]
mode: obligations
outcome: proved
---*)
---- MODULE nested_instance_name ----
CONSTANT c
VARIABLE x
I == INSTANCE Outer WITH k <- c, v <- x
THEOREM I!J!Op(c)
  BY DEF I!J!Op
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
           I!J!Op(a) == a = c
    PROVE  I!J!Op(c)

    @type: obligationsnumber
    @count: 1
---*)

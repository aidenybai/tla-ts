(*---
description: A theorem of a named instance is cited as I!Thm, which gives a support obligation that proves I!Thm.
ref: src/module/m_elab.ml#localize
includes: [Lib.tla]
mode: obligations
outcome: proved
---*)
---- MODULE named_instance_theorem_cited ----
CONSTANT c
VARIABLE x
I == INSTANCE Lib WITH k <- c, v <- x
THEOREM I!Op(c)
  BY I!LT
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
           I!LT 
    PROVE  I!Op(c)

    @type: obligation
    @id: 2
    @loc: 13:6:13:10
    @status: to be proved
    @obl: ASSUME NEW CONSTANT c,
           NEW VARIABLE x
    PROVE  I!LT

    @type: obligationsnumber
    @count: 2
---*)

(*---
description: A LET may define a named instance, and its definitions are used in the LET body.
ref: src/module/m_elab.ml#anon
includes: [Lib.tla]
mode: obligations
outcome: proved
---*)
---- MODULE let_instance ----
CONSTANT c
VARIABLE x
THEOREM LET I == INSTANCE Lib WITH k <- c, v <- x IN I!Op(c)
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
           NEW VARIABLE x
    PROVE  LET I!Op(a) == a = c
               I!Nxt == x' = c
               I!Priv$1 == c
               I!UsesPriv == I!Priv$1 = c
               I!LA == c = c
           IN  I!Op(c)

    @type: obligationsnumber
    @count: 1
---*)

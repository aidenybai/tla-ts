(*---
description: A definition of the instance that uses a LOCAL definition of the instantiated module refers to the local one, which DEF cannot reach by name.
ref: src/module/m_elab.ml#localize
includes: [Lib.tla]
mode: obligations
outcome: proved
---*)
---- MODULE instance_local_definition_used ----
CONSTANT c
VARIABLE x
I == INSTANCE Lib WITH k <- c, v <- x
THEOREM I!UsesPriv
  BY DEF I!UsesPriv
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
           I!UsesPriv == I!Priv$1 = c
    PROVE  I!UsesPriv

    @type: obligationsnumber
    @count: 1
---*)

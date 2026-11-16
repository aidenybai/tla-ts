(*---
description: A definition of an instance that uses ENABLED gets the instance's variable substituted inside ENABLED.
ref: src/module/m_elab.ml#lambdify_enabled_cdot
includes: [EnLib.tla]
mode: obligations
outcome: proved
---*)
---- MODULE instance_enabled_definition ----
VARIABLE x
I == INSTANCE EnLib WITH v <- x
THEOREM I!En
  BY DEF I!En
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    @type: obligation
    @id: 1
    @loc: 12:3:12:5
    @status: to be proved
    @obl: ASSUME NEW VARIABLE x,
           I!En == ?EnabledWrapper(LAMBDA r#0 : r#0 = x)
    PROVE  I!En

    @type: obligationsnumber
    @count: 1
---*)

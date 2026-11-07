(*---
description: A non-local definition of an extended module can be made visible by DEF.
ref: src/module/m_flatten.ml#flatten
includes: [LocalLib.tla]
mode: obligations
outcome: proved
---*)
---- MODULE extended_definition ----
EXTENDS LocalLib
THEOREM Shown = 2
  BY DEF Shown
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    @type: obligation
    @id: 1
    @loc: 11:3:11:5
    @status: to be proved
    @obl: ASSUME Shown == 2
    PROVE  Shown = 2

    @type: obligationsnumber
    @count: 1
---*)

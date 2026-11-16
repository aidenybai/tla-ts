(*---
description: A module-level definition is hidden by default, so a later obligation does not print it in its context.
ref: src/module/m_parser.ml#modunit
mode: obligations
outcome: proved
---*)
---- MODULE definitions_hidden_by_default ----
EXTENDS Naturals
CONSTANT c
Op == c + 0
THEOREM Op = Op
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
    @obl: ASSUME NEW CONSTANT c
    PROVE  Op = Op

    @type: obligationsnumber
    @count: 1
---*)

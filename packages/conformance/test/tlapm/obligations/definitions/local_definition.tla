(*---
description: A LOCAL definition is used in a theorem like any other definition, and DEF makes it visible.
ref: src/module/m_parser.ml#modunit
mode: obligations
outcome: proved
---*)
---- MODULE local_definition ----
CONSTANT c
LOCAL Op == c
THEOREM Op = c
  BY DEF Op
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    @type: obligation
    @id: 1
    @loc: 11:3:11:5
    @status: to be proved
    @obl: ASSUME NEW CONSTANT c,
           Op == c
    PROVE  Op = c

    @type: obligationsnumber
    @count: 1
---*)

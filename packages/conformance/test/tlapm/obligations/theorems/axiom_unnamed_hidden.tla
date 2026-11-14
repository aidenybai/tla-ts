(*---
description: An unnamed AXIOM is a hidden fact, so it does not appear in a later obligation.
ref: src/module/m_t.ml#hyps_of_modunit
mode: obligations
outcome: proved
---*)
---- MODULE axiom_unnamed_hidden ----
CONSTANT c
AXIOM c = 1
THEOREM c = 1
  OBVIOUS
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    @type: obligation
    @id: 1
    @loc: 11:3:11:10
    @status: to be proved
    @obl: ASSUME NEW CONSTANT c
    PROVE  c = 1

    @type: obligationsnumber
    @count: 1
---*)

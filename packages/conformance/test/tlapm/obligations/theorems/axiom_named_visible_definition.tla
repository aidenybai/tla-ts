(*---
description: A named AXIOM is a visible definition, printed in later contexts as name == formula, while the fact itself stays hidden.
ref: src/module/m_t.ml#hyps_of_modunit
mode: obligations
outcome: proved
---*)
---- MODULE axiom_named_visible_definition ----
CONSTANT c
AXIOM A == c = 1
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
    @obl: ASSUME NEW CONSTANT c,
           A == c = 1
    PROVE  c = 1

    @type: obligationsnumber
    @count: 1
---*)

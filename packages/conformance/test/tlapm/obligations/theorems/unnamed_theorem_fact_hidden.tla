(*---
description: An earlier unnamed theorem becomes a hidden fact of later theorems, so it is not printed in their obligations.
ref: src/module/m_gen.ml#generate
mode: obligations
outcome: proved
---*)
---- MODULE unnamed_theorem_fact_hidden ----
CONSTANT c
THEOREM c = c
  OBVIOUS
THEOREM c # 1
  OBVIOUS
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    @type: obligation
    @id: 1
    @loc: 10:3:10:10
    @status: to be proved
    @obl: ASSUME NEW CONSTANT c
    PROVE  c = c

    @type: obligation
    @id: 2
    @loc: 12:3:12:10
    @status: to be proved
    @obl: ASSUME NEW CONSTANT c
    PROVE  c # 1

    @type: obligationsnumber
    @count: 2
---*)

(*---
description: A definition used in a theorem's ASSUME stays folded in the hypothesis.
ref: src/module/m_gen.ml#generate
mode: obligations
outcome: proved
---*)
---- MODULE definition_used_in_assume ----
CONSTANT c
Pos == c = 1
THEOREM ASSUME Pos PROVE c = 1
  BY DEF Pos
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
           Pos == c = 1,
           Pos 
    PROVE  c = 1

    @type: obligationsnumber
    @count: 1
---*)

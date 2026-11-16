(*---
description: DEF of a named axiom keeps its already visible definition and adds no fact.
ref: src/proof/p_anon.ml#usable
mode: obligations
outcome: proved
---*)
---- MODULE by_def_axiom_name ----
CONSTANT c
AXIOM A == c = 1
THEOREM c = 1
  BY DEF A
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
           A == c = 1
    PROVE  c = 1

    @type: obligationsnumber
    @count: 1
---*)

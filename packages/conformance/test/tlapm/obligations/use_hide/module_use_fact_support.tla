(*---
description: A module-level USE of a fact gives a support obligation of its own, located at the USE.
ref: src/module/m_gen.ml#generate
mode: obligations
outcome: proved
---*)
---- MODULE module_use_fact_support ----
CONSTANT c
AXIOM A == c = 1
USE A
THEOREM c = 1
  OBVIOUS
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    @type: obligation
    @id: 1
    @loc: 10:1:10:4
    @status: to be proved
    @obl: ASSUME NEW CONSTANT c,
           A == c = 1
    PROVE  A

    @type: obligation
    @id: 2
    @loc: 12:3:12:10
    @status: to be proved
    @obl: ASSUME NEW CONSTANT c,
           A == c = 1,
           A 
    PROVE  c = 1

    @type: obligationsnumber
    @count: 2
---*)

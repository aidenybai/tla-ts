(*---
description: A module-level USE does not affect theorems before it.
ref: src/module/m_gen.ml#generate
mode: obligations
outcome: proved
---*)
---- MODULE module_use_not_before ----
CONSTANT c
AXIOM A == c = 1
THEOREM c = 1
  OBVIOUS
USE A
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

    @type: obligation
    @id: 2
    @loc: 12:1:12:4
    @status: to be proved
    @obl: ASSUME NEW CONSTANT c,
           A == c = 1
    PROVE  A

    @type: obligationsnumber
    @count: 2
---*)

(*---
description: A fact used at module level is visible in the obligations of every later theorem.
ref: src/proof/p_gen.ml#mutate
mode: obligations
outcome: proved
---*)
---- MODULE module_use_fact_visible_later ----
CONSTANT c
AXIOM A == c = 1
USE A
THEOREM c = 1
  OBVIOUS
THEOREM c # 2
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

    @type: obligation
    @id: 3
    @loc: 14:3:14:10
    @status: to be proved
    @obl: ASSUME NEW CONSTANT c,
           A == c = 1,
           A 
    PROVE  c # 2

    @type: obligationsnumber
    @count: 3
---*)

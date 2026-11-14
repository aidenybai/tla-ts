(*---
description: A module-level USE with facts and DEF makes the definitions visible first, then gives a support obligation per fact.
ref: src/proof/p_gen.ml#mutate
mode: obligations
outcome: proved
---*)
---- MODULE module_use_facts_and_defs ----
CONSTANT c
Op == c
AXIOM A == Op = c
AXIOM B == c = c
USE A, B DEF Op
THEOREM TRUE
  OBVIOUS
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    @type: obligation
    @id: 1
    @loc: 12:1:12:16
    @status: to be proved
    @obl: ASSUME NEW CONSTANT c,
           Op == c,
           A == Op = c,
           B == c = c
    PROVE  A

    @type: obligation
    @id: 2
    @loc: 12:1:12:16
    @status: to be proved
    @obl: ASSUME NEW CONSTANT c,
           Op == c,
           A == Op = c,
           B == c = c,
           A 
    PROVE  B

    @type: obligation
    @id: 3
    @loc: 14:3:14:10
    @status: to be proved
    @obl: ASSUME NEW CONSTANT c,
           Op == c,
           A == Op = c,
           B == c = c,
           A ,
           B 
    PROVE  TRUE

    @type: obligationsnumber
    @count: 3
---*)

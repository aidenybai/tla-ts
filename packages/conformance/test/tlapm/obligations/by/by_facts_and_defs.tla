(*---
description: In BY with facts and DEF, the definitions are made visible before the facts, so every support obligation sees them.
ref: src/proof/p_simplify.ml#simplify
mode: obligations
outcome: proved
---*)
---- MODULE by_facts_and_defs ----
CONSTANT c
Op == c
AXIOM A == Op = c
THEOREM c = c
  BY A DEF Op
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    @type: obligation
    @id: 1
    @loc: 12:3:12:5
    @status: to be proved
    @obl: ASSUME NEW CONSTANT c,
           Op == c,
           A == Op = c,
           A 
    PROVE  c = c

    @type: obligation
    @id: 2
    @loc: 12:6:12:7
    @status: to be proved
    @obl: ASSUME NEW CONSTANT c,
           Op == c,
           A == Op = c
    PROVE  A

    @type: obligationsnumber
    @count: 2
---*)

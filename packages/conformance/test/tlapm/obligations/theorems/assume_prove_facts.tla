(*---
description: Formula assumptions of a theorem's ASSUME are visible facts in its obligation, after the declarations they follow.
ref: src/module/m_gen.ml#generate
mode: obligations
outcome: proved
---*)
---- MODULE assume_prove_facts ----
CONSTANT c
THEOREM ASSUME c = 1, NEW d, d = c PROVE d = 1
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
    @obl: ASSUME NEW CONSTANT c,
           c = 1 ,
           NEW CONSTANT d,
           d = c 
    PROVE  d = 1

    @type: obligationsnumber
    @count: 1
---*)

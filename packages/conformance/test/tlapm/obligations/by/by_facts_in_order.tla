(*---
description: The support obligation of each cited fact can use the facts cited before it, but not those after it.
ref: src/proof/p_gen.ml#mutate
mode: obligations
outcome: proved
---*)
---- MODULE by_facts_in_order ----
CONSTANT c
THEOREM c = c
  BY 1 = 1, 2 = 2, 3 = 3
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    @type: obligation
    @id: 1
    @loc: 10:3:10:5
    @status: to be proved
    @obl: ASSUME NEW CONSTANT c,
           1 = 1 ,
           2 = 2 ,
           3 = 3 
    PROVE  c = c

    @type: obligation
    @id: 2
    @loc: 10:6:10:11
    @status: to be proved
    @obl: ASSUME NEW CONSTANT c
    PROVE  1 = 1

    @type: obligation
    @id: 3
    @loc: 10:13:10:18
    @status: to be proved
    @obl: ASSUME NEW CONSTANT c,
           1 = 1 
    PROVE  2 = 2

    @type: obligation
    @id: 4
    @loc: 10:20:10:25
    @status: to be proved
    @obl: ASSUME NEW CONSTANT c,
           1 = 1 ,
           2 = 2 
    PROVE  3 = 3

    @type: obligationsnumber
    @count: 4
---*)

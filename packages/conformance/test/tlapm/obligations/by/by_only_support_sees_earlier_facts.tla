(*---
description: The support obligations of BY ONLY still see the earlier visible facts, because the facts are hidden only after they are cited.
ref: src/proof/p_simplify.ml#simplify
mode: obligations
outcome: proved
---*)
---- MODULE by_only_support_sees_earlier_facts ----
CONSTANT c
THEOREM ASSUME c = 1, c = 2 PROVE c = 2
  BY ONLY c = 2
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
           c = 2 
    PROVE  c = 2

    @type: obligation
    @id: 2
    @loc: 10:11:10:16
    @status: to be proved
    @obl: ASSUME NEW CONSTANT c,
           c = 1 ,
           c = 2 
    PROVE  c = 2

    @type: obligationsnumber
    @count: 2
---*)

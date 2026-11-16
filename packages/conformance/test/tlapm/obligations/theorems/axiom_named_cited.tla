(*---
description: Citing a named AXIOM in BY adds the name as a fact and a support obligation for it.
ref: src/proof/p_simplify.ml#simplify
mode: obligations
outcome: proved
---*)
---- MODULE axiom_named_cited ----
CONSTANT c
AXIOM A == c = 1
THEOREM c = 1
  BY A
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
           A == c = 1,
           A 
    PROVE  c = 1

    @type: obligation
    @id: 2
    @loc: 11:6:11:7
    @status: to be proved
    @obl: ASSUME NEW CONSTANT c,
           A == c = 1
    PROVE  A

    @type: obligationsnumber
    @count: 2
---*)

(*---
description: A backend pragma mixed with a fact is a fact in the main obligation's context, after the fact.
ref: src/proof/p_simplify.ml#simplify
mode: obligations
outcome: proved
---*)
---- MODULE by_pragma_with_fact ----
EXTENDS TLAPS
CONSTANT c
AXIOM A == c = 1
THEOREM c = 1
  BY A, Zenon
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
           A == c = 1,
           A ,
           Zenon 
    PROVE  c = 1

    @type: obligation
    @id: 2
    @loc: 12:6:12:7
    @status: to be proved
    @obl: ASSUME NEW CONSTANT c,
           A == c = 1
    PROVE  A

    @type: obligation
    @id: 3
    @loc: 12:9:12:14
    @status: to be proved
    @obl: ASSUME NEW CONSTANT c,
           A == c = 1,
           A 
    PROVE  Zenon

    @type: obligationsnumber
    @count: 3
---*)

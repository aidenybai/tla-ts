(*---
description: A QED step may have a structured subproof, whose QED proves the enclosing goal.
ref: src/proof/p_parser.ml#to_step
mode: obligations
outcome: proved
---*)
---- MODULE qed_with_subproof ----
CONSTANT c
THEOREM c = c
<1> QED
  <2>1. c = c
    OBVIOUS
  <2> QED
    BY <2>1
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    @type: obligation
    @id: 1
    @loc: 14:5:14:7
    @status: to be proved
    @obl: ASSUME NEW CONSTANT c,
           <2>1 
    PROVE  c = c

    @type: obligation
    @id: 2
    @loc: 14:8:14:12
    @status: to be proved
    @obl: ASSUME NEW CONSTANT c
    PROVE  <2>1

    @type: obligation
    @id: 3
    @loc: 12:5:12:12
    @status: to be proved
    @obl: ASSUME NEW CONSTANT c
    PROVE  c = c

    @type: obligationsnumber
    @count: 3
---*)

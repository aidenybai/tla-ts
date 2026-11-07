(*---
description: ASSUMPTION is a synonym of AXIOM, and citing its name gives a support obligation.
ref: src/module/m_parser.ml#modunit
mode: obligations
outcome: proved
---*)
---- MODULE assumption_keyword ----
EXTENDS Naturals
CONSTANT c
ASSUMPTION Pos == c > 0
THEOREM c > 0
  BY Pos
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
           Pos == c > 0,
           Pos 
    PROVE  c > 0

    @type: obligation
    @id: 2
    @loc: 12:6:12:9
    @status: to be proved
    @obl: ASSUME NEW CONSTANT c,
           Pos == c > 0
    PROVE  Pos

    @type: obligationsnumber
    @count: 2
---*)

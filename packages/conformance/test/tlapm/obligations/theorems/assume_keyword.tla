(*---
description: ASSUME at module level is a synonym of AXIOM, and a named one prints as a visible definition.
ref: src/module/m_parser.ml#modunit
mode: obligations
outcome: proved
---*)
---- MODULE assume_keyword ----
EXTENDS Naturals
CONSTANT c
ASSUME Pos == c > 0
THEOREM c > 0
  OBVIOUS
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    @type: obligation
    @id: 1
    @loc: 12:3:12:10
    @status: to be proved
    @obl: ASSUME NEW CONSTANT c,
           Pos == c > 0
    PROVE  c > 0

    @type: obligationsnumber
    @count: 1
---*)

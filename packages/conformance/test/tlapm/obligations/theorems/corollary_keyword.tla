(*---
description: COROLLARY is a synonym of THEOREM and gives the same single obligation.
ref: src/module/m_parser.ml#modunit
mode: obligations
outcome: proved
---*)
---- MODULE corollary_keyword ----
COROLLARY 1 = 1
  OBVIOUS
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    @type: obligation
    @id: 1
    @loc: 9:3:9:10
    @status: to be proved
    @obl: 1 = 1

    @type: obligationsnumber
    @count: 1
---*)

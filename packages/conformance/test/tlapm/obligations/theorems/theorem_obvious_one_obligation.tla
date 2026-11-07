(*---
description: An unnamed THEOREM proved OBVIOUS gives one obligation whose goal is the theorem's formula and whose context is empty.
ref: src/proof/p_gen.ml#generate
mode: obligations
outcome: proved
---*)
---- MODULE theorem_obvious_one_obligation ----
THEOREM TRUE /\ TRUE
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
    @obl: TRUE /\ TRUE

    @type: obligationsnumber
    @count: 1
---*)

(*---
description: Inside its own proof a named theorem is defined but is not a fact, so citing it makes a support obligation that proves the theorem's name from nothing.
ref: src/module/m_elab.ml#normalize
mode: obligations
outcome: proved
---*)
---- MODULE named_theorem_in_own_proof ----
CONSTANT c
THEOREM T == c = c
  BY T
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
           T 
    PROVE  c = c

    @type: obligation
    @id: 2
    @loc: 10:6:10:7
    @status: to be proved
    @obl: ASSUME NEW CONSTANT c
    PROVE  T

    @type: obligationsnumber
    @count: 2
---*)

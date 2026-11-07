(*---
description: A module-level USE of a named theorem gives a support obligation proving the name, and makes it visible later.
ref: src/proof/p_gen.ml#mutate
mode: obligations
outcome: proved
---*)
---- MODULE module_use_theorem_name ----
CONSTANT c
THEOREM T == c = c
  OBVIOUS
USE T
THEOREM c = c /\ TRUE
  OBVIOUS
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    @type: obligation
    @id: 1
    @loc: 10:3:10:10
    @status: to be proved
    @obl: ASSUME NEW CONSTANT c
    PROVE  c = c

    @type: obligation
    @id: 2
    @loc: 11:1:11:4
    @status: to be proved
    @obl: ASSUME NEW CONSTANT c
    PROVE  T

    @type: obligation
    @id: 3
    @loc: 13:3:13:10
    @status: to be proved
    @obl: ASSUME NEW CONSTANT c,
           T 
    PROVE  c = c /\ TRUE

    @type: obligationsnumber
    @count: 3
---*)

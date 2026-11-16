(*---
description: Citing a named theorem in BY adds its name as a fact and a support obligation that proves the name.
ref: src/proof/p_gen.ml#gen_step
mode: obligations
outcome: proved
---*)
---- MODULE named_theorem_cited ----
CONSTANT c
THEOREM T == c = c
  OBVIOUS
THEOREM c = c /\ TRUE
  BY T
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
    @loc: 12:3:12:5
    @status: to be proved
    @obl: ASSUME NEW CONSTANT c,
           T 
    PROVE  c = c /\ TRUE

    @type: obligation
    @id: 3
    @loc: 12:6:12:7
    @status: to be proved
    @obl: ASSUME NEW CONSTANT c
    PROVE  T

    @type: obligationsnumber
    @count: 3
---*)

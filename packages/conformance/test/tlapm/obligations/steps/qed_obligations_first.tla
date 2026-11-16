(*---
description: In a structured proof the QED step's obligations are numbered before the obligations of the steps that precede it.
ref: src/proof/p_gen.ml#collect
mode: obligations
outcome: proved
---*)
---- MODULE qed_obligations_first ----
CONSTANT c
THEOREM c = c
<1>1. 1 = 1
  OBVIOUS
<1>2. 2 = 2
  OBVIOUS
<1> QED
  OBVIOUS
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    @type: obligation
    @id: 1
    @loc: 15:3:15:10
    @status: to be proved
    @obl: ASSUME NEW CONSTANT c
    PROVE  c = c

    @type: obligation
    @id: 2
    @loc: 11:3:11:10
    @status: to be proved
    @obl: ASSUME NEW CONSTANT c
    PROVE  1 = 1

    @type: obligation
    @id: 3
    @loc: 13:3:13:10
    @status: to be proved
    @obl: ASSUME NEW CONSTANT c
    PROVE  2 = 2

    @type: obligationsnumber
    @count: 3
---*)

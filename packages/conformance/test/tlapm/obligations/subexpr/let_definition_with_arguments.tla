(*---
description: Op!:!d(e) applies the LET definition d to e.
ref: src/expr/e_deref.ml#deref_letop
mode: obligations
outcome: proved
---*)
---- MODULE let_definition_with_arguments ----
CONSTANT c
Op == LET d(a) == a IN d(c) = c
THEOREM Op!:!d(1) = 1
  OBVIOUS
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    @type: obligation
    @id: 1
    @loc: 11:3:11:10
    @status: to be proved
    @obl: ASSUME NEW CONSTANT c
    PROVE  1 = 1

    @type: obligationsnumber
    @count: 1
---*)

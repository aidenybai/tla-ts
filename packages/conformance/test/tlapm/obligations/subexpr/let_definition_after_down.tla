(*---
description: Op!:!d names the definition d of a LET in Op's body.
ref: src/expr/e_deref.ml#deref_letop
mode: obligations
outcome: proved
---*)
---- MODULE let_definition_after_down ----
CONSTANT c
Op == LET d == c IN d = c
THEOREM Op!:!d = c
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
    PROVE  c = c

    @type: obligationsnumber
    @count: 1
---*)

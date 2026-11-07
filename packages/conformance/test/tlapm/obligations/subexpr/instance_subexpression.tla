(*---
description: A subexpression of an instance's definition is selected after the substitution.
ref: src/expr/e_anon.ml#anon_sg
includes: [SubLib.tla]
mode: obligations
outcome: proved
---*)
---- MODULE instance_subexpression ----
CONSTANT c
I == INSTANCE SubLib WITH k <- c
THEOREM I!Op!2
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
    @obl: ASSUME NEW CONSTANT c
    PROVE  c = 2

    @type: obligationsnumber
    @count: 1
---*)

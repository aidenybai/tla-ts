(*---
description: In obligations mode a constant of arity 0 applied to an argument is accepted, since tlapm leaves arity checks to SANY.
ref: src/expr/e_anon.ml#anons
mode: obligations
outcome: proved
---*)
---- MODULE constant_applied ----
CONSTANT c
THEOREM c(1) = 1 OBVIOUS
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    @type: obligation
    @id: 1
    @loc: 9:18:9:25
    @status: to be proved
    @obl: ASSUME NEW CONSTANT c
    PROVE  c(1) = 1

    @type: obligationsnumber
    @count: 1
---*)

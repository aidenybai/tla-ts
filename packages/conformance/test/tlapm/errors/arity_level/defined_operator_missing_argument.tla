(*---
description: In obligations mode an operator with parameters used without arguments is accepted, since tlapm leaves arity checks to SANY.
ref: src/expr/e_anon.ml#anons
mode: obligations
outcome: proved
---*)
---- MODULE defined_operator_missing_argument ----
F(a) == a
THEOREM F = 1 OBVIOUS
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    @type: obligation
    @id: 1
    @loc: 9:15:9:22
    @status: to be proved
    @obl: F = 1

    @type: obligationsnumber
    @count: 1
---*)

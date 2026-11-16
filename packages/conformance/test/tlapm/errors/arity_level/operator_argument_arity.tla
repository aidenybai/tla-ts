(*---
description: In obligations mode an operator parameter H(_) given a constant is accepted, since tlapm leaves arity checks to SANY.
ref: src/expr/e_anon.ml#anons
mode: obligations
outcome: proved
---*)
---- MODULE operator_argument_arity ----
G(H(_)) == H(1)
THEOREM G(1) = 1 OBVIOUS
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    @type: obligation
    @id: 1
    @loc: 9:18:9:25
    @status: to be proved
    @obl: G(1) = 1

    @type: obligationsnumber
    @count: 1
---*)

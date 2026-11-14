(*---
description: In obligations mode tlapm does not check arity, so F(1, 2) for a one-parameter F is accepted and printed as written. tlapm leaves arity checks to SANY.
ref: src/expr/e_anon.ml#anons
mode: obligations
outcome: proved
---*)
---- MODULE defined_operator_extra_argument ----
F(a) == a
THEOREM F(1, 2) = 1 OBVIOUS
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    @type: obligation
    @id: 1
    @loc: 9:21:9:28
    @status: to be proved
    @obl: F(1, 2) = 1

    @type: obligationsnumber
    @count: 1
---*)

(*---
description: In obligations mode a declared operator CONSTANT F(_) applied to two arguments is accepted, since tlapm leaves arity checks to SANY.
ref: src/expr/e_anon.ml#anons
mode: obligations
outcome: proved
---*)
---- MODULE declared_operator_extra_argument ----
CONSTANT F(_)
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
    @obl: ASSUME NEW CONSTANT F(_)
    PROVE  F(1, 2) = 1

    @type: obligationsnumber
    @count: 1
---*)

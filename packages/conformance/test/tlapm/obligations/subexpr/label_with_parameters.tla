(*---
description: A label with parameters is instantiated by Op!lab(e).
ref: src/expr/e_deref.ml#deref_label
mode: obligations
outcome: proved
---*)
---- MODULE label_with_parameters ----
CONSTANT P(_)
Op == \A x : lab(x) :: P(x)
THEOREM Op!lab(1)
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
    @obl: ASSUME NEW CONSTANT P(_)
    PROVE  P(1)

    @type: obligationsnumber
    @count: 1
---*)

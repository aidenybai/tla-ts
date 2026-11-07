(*---
description: "/= prints as #, and ~(a = b) prints as ~a = b because = binds tighter than ~."
ref: src/expr/e_fmt.ml#fmt_expr
mode: obligations
outcome: proved
---*)
---- MODULE negation_and_inequality ----
CONSTANT a, b
THEOREM ~(a = b) <=> (a # b) /\ (a /= b)
  OBVIOUS
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    @type: obligation
    @id: 1
    @loc: 10:3:10:10
    @status: to be proved
    @obl: ASSUME NEW CONSTANT a,
           NEW CONSTANT b
    PROVE  ~a = b <=> a # b /\ a # b

    @type: obligationsnumber
    @count: 1
---*)

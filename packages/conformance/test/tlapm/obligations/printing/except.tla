(*---
description: "An EXCEPT with two clauses becomes two nested EXCEPTs, and @ in a new value becomes the old value f[1]."
ref: src/expr/e_fmt.ml#fmt_expr
mode: obligations
outcome: proved
---*)
---- MODULE except ----
EXTENDS Naturals
CONSTANT f
THEOREM [f EXCEPT ![1] = @ + 1, ![2].a = 3] = [f EXCEPT ![1] = f[1] + 1, ![2].a = 3]
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
    @obl: ASSUME NEW CONSTANT f
    PROVE  [[f EXCEPT ![1] = f[1] + 1] EXCEPT ![2].a = 3]
           = [[f EXCEPT ![1] = f[1] + 1] EXCEPT ![2].a = 3]

    @type: obligationsnumber
    @count: 1
---*)

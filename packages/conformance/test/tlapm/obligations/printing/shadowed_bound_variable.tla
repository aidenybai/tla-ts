(*---
description: A bound variable that reuses a constant's name is printed with a suffix to tell it apart.
ref: src/expr/e_fmt.ml#fmt_expr
mode: obligations
outcome: proved
---*)
---- MODULE shadowed_bound_variable ----
CONSTANT x
THEOREM \A x_1 : \E x : x = x_1
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
    @obl: ASSUME NEW CONSTANT x
    PROVE  \A x_1 : \E x_2 : x_2 = x_1

    @type: obligationsnumber
    @count: 1
---*)

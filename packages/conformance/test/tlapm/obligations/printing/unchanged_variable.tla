(*---
description: UNCHANGED of a variable prints as UNCHANGED, not as its expansion.
ref: src/expr/e_fmt.ml#fmt_expr
mode: obligations
outcome: proved
---*)
---- MODULE unchanged_variable ----
VARIABLE x
THEOREM UNCHANGED x => x' = x
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
    @obl: ASSUME NEW VARIABLE x
    PROVE  UNCHANGED x => x' = x

    @type: obligationsnumber
    @count: 1
---*)

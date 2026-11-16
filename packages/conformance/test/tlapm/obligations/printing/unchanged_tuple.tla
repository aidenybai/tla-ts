(*---
description: UNCHANGED of a tuple of variables keeps the tuple.
ref: src/expr/e_fmt.ml#fmt_expr
mode: obligations
outcome: proved
---*)
---- MODULE unchanged_tuple ----
VARIABLES x, y
THEOREM UNCHANGED <<x, y>> => UNCHANGED x
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
    @obl: ASSUME NEW VARIABLE x,
           NEW VARIABLE y
    PROVE  UNCHANGED <<x, y>> => UNCHANGED x

    @type: obligationsnumber
    @count: 1
---*)

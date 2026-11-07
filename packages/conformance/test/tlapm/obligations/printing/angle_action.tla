(*---
description: <<A>>_v prints as an angle action with its subscript.
ref: src/expr/e_fmt.ml#fmt_expr
mode: obligations
outcome: proved
---*)
---- MODULE angle_action ----
VARIABLE x
THEOREM <<x' # x>>_x => x' # x
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
    PROVE  <<x' # x>>_x => x' # x

    @type: obligationsnumber
    @count: 1
---*)

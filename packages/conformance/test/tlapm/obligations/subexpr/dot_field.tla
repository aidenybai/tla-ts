(*---
description: The second subexpression of r.f is the field name as a string.
ref: src/expr/e_deref.ml#deref_num
mode: obligations
outcome: proved
---*)
---- MODULE dot_field ----
CONSTANT r
Op == r.fld
THEOREM Op!2 = "fld"
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
    @obl: ASSUME NEW CONSTANT r
    PROVE  "fld" = "fld"

    @type: obligationsnumber
    @count: 1
---*)

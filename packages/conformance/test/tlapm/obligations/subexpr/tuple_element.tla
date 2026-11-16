(*---
description: The numbered subexpressions of a tuple are its components.
ref: src/expr/e_deref.ml#deref_num
mode: obligations
outcome: proved
---*)
---- MODULE tuple_element ----
Op == <<1, 2>>
THEOREM Op!2 = 2
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
    @obl: 2 = 2

    @type: obligationsnumber
    @count: 1
---*)

(*---
description: The numbered subexpressions of a set enumeration are its elements.
ref: src/expr/e_deref.ml#deref_num
mode: obligations
outcome: proved
---*)
---- MODULE set_enumeration ----
Op == {1, 2, 3}
THEOREM Op!3 = 3
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
    @obl: 3 = 3

    @type: obligationsnumber
    @count: 1
---*)

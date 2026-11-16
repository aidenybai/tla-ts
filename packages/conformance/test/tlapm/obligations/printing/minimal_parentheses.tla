(*---
description: The printer drops parentheses that precedence makes redundant and keeps the needed ones.
ref: src/expr/e_fmt.ml#pp_print_expr
mode: obligations
outcome: proved
---*)
---- MODULE minimal_parentheses ----
EXTENDS Naturals
CONSTANT a, b, c
THEOREM ((a + b) * c = (a + (b * c))) => ((a = b) /\ ((b = c) \/ (c = a)))
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
    @obl: ASSUME NEW CONSTANT a,
           NEW CONSTANT b,
           NEW CONSTANT c
    PROVE  (a + b) * c = a + b * c => a = b /\ (b = c \/ c = a)

    @type: obligationsnumber
    @count: 1
---*)

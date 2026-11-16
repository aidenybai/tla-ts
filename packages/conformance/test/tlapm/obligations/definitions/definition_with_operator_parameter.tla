(*---
description: A definition with an operator parameter prints the parameter with its arity.
ref: src/expr/e_fmt.ml#pp_print_defn
mode: obligations
outcome: proved
---*)
---- MODULE definition_with_operator_parameter ----
CONSTANT c
Op(F(_), a) == F(a)
THEOREM Op(LAMBDA x : x, c) = c
  BY DEF Op
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    @type: obligation
    @id: 1
    @loc: 11:3:11:5
    @status: to be proved
    @obl: ASSUME NEW CONSTANT c,
           Op(F(_), a) == F(a)
    PROVE  Op(LAMBDA x : x, c) = c

    @type: obligationsnumber
    @count: 1
---*)

(*---
description: A definition with parameters made visible by DEF prints with its parameters.
ref: src/expr/e_fmt.ml#pp_print_defn
mode: obligations
outcome: proved
---*)
---- MODULE by_def_operator_with_parameters ----
CONSTANT c
Op(a, b) == a = b
THEOREM Op(c, c)
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
           Op(a, b) == a = b
    PROVE  Op(c, c)

    @type: obligationsnumber
    @count: 1
---*)

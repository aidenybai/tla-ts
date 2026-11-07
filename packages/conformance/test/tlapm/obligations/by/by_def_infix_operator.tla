(*---
description: An infix operator definition made visible by DEF prints as a definition of its symbol.
ref: src/expr/e_fmt.ml#pp_print_defn
mode: obligations
outcome: proved
---*)
---- MODULE by_def_infix_operator ----
CONSTANT c
a ++ b == a
THEOREM c ++ c = c
  BY DEF ++
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
           ++(a, b) == a
    PROVE  c ++ c = c

    @type: obligationsnumber
    @count: 1
---*)

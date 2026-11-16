(*---
description: "tlapm does not check that the bound of a NEW CONSTANT is constant, so NEW CONSTANT c \\in {x} is accepted."
ref: src/expr/e_levels.ml#level_computation
mode: obligations
outcome: proved
---*)
---- MODULE constant_bounded_by_variable_accepted ----
VARIABLE x
THEOREM ASSUME NEW CONSTANT c \in {x} PROVE TRUE OBVIOUS
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    @type: obligation
    @id: 1
    @loc: 9:50:9:57
    @status: to be proved
    @obl: ASSUME NEW VARIABLE x,
           NEW CONSTANT c \in {x}
    PROVE  TRUE

    @type: obligationsnumber
    @count: 1
---*)

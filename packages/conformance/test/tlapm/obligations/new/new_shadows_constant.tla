(*---
description: A NEW that reuses the name of a module constant shadows it, and the printer renames the inner one.
ref: src/expr/e_fmt.ml#pp_print_hyp
mode: obligations
outcome: proved
---*)
---- MODULE new_shadows_constant ----
CONSTANT y
THEOREM ASSUME NEW y PROVE y = y
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
    @obl: ASSUME NEW CONSTANT y,
           NEW CONSTANT y_1
    PROVE  y_1 = y_1

    @type: obligationsnumber
    @count: 1
---*)

(*---
description: A step definition may reuse the name of a module definition, and the printer renames the step's one.
ref: src/expr/e_fmt.ml#pp_print_defn
mode: obligations
outcome: proved
---*)
---- MODULE step_definition_shadows_module ----
CONSTANT c
F == c
THEOREM c = c
<1> F == 1
<1> QED
  OBVIOUS
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    @type: obligation
    @id: 1
    @loc: 13:3:13:10
    @status: to be proved
    @obl: ASSUME NEW CONSTANT c,
           F_1 == 1
    PROVE  c = c

    @type: obligationsnumber
    @count: 1
---*)

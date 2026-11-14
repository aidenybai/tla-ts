(*---
description: A step whose assertion is an ASSUME ... PROVE nested in a goal prints the inner sequent indented.
ref: src/expr/e_fmt.ml#pp_print_sequent
mode: obligations
outcome: proved
---*)
---- MODULE nested_sequent_goal ----
CONSTANT P(_)
THEOREM ASSUME ASSUME NEW x, P(x) PROVE P(x) PROVE TRUE
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
    @obl: ASSUME NEW CONSTANT P(_),
           ASSUME NEW CONSTANT x,
                  P(x) 
           PROVE  P(x) 
    PROVE  TRUE

    @type: obligationsnumber
    @count: 1
---*)

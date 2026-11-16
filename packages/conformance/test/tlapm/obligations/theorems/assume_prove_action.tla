(*---
description: NEW ACTION declares an action-level operator, printed as NEW ACTION.
ref: src/expr/e_fmt.ml#pp_print_hyp
mode: obligations
outcome: proved
---*)
---- MODULE assume_prove_action ----
THEOREM ASSUME NEW ACTION A PROVE A => A
  OBVIOUS
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    @type: obligation
    @id: 1
    @loc: 9:3:9:10
    @status: to be proved
    @obl: ASSUME NEW ACTION A
    PROVE  A => A

    @type: obligationsnumber
    @count: 1
---*)

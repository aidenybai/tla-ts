(*---
description: NEW STATE declares a state-level operator, printed as NEW STATE.
ref: src/expr/e_fmt.ml#pp_print_hyp
mode: obligations
outcome: proved
---*)
---- MODULE assume_prove_state ----
THEOREM ASSUME NEW STATE s PROVE s = s
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
    @obl: ASSUME NEW STATE s
    PROVE  s = s

    @type: obligationsnumber
    @count: 1
---*)

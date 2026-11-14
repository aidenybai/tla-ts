(*---
description: NEW VARIABLE in an ASSUME is printed as NEW VARIABLE in the obligation.
ref: src/expr/e_fmt.ml#pp_print_hyp
mode: obligations
outcome: proved
---*)
---- MODULE assume_prove_variable ----
THEOREM ASSUME NEW VARIABLE v PROVE v' = v'
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
    @obl: ASSUME NEW VARIABLE v
    PROVE  v' = v'

    @type: obligationsnumber
    @count: 1
---*)

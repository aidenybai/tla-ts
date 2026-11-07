(*---
description: NEW TEMPORAL declares a temporal operator, printed as NEW TEMPORAL.
ref: src/expr/e_fmt.ml#pp_print_hyp
mode: obligations
outcome: proved
---*)
---- MODULE assume_prove_temporal ----
THEOREM ASSUME NEW TEMPORAL F PROVE []F => F
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
    @obl: ASSUME NEW TEMPORAL F
    PROVE  []F => F

    @type: obligationsnumber
    @count: 1
---*)

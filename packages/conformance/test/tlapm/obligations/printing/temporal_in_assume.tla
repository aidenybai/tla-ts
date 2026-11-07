(*---
description: Temporal hypotheses of an ASSUME print as written, without a time annotation.
ref: src/expr/e_fmt.ml#pp_print_time
mode: obligations
outcome: proved
---*)
---- MODULE temporal_in_assume ----
VARIABLE x
THEOREM ASSUME [](x = 1), x = 1 PROVE <>(x = 1)
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
    @obl: ASSUME NEW VARIABLE x,
           [](x = 1) ,
           x = 1 
    PROVE  <>(x = 1)

    @type: obligationsnumber
    @count: 1
---*)

(*---
description: A primed defined operator stays folded as Op'.
ref: src/expr/e_fmt.ml#fmt_expr
mode: obligations
outcome: proved
---*)
---- MODULE prime_definition ----
VARIABLE x
Op == x = 1
THEOREM Op' => Op'
  OBVIOUS
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    @type: obligation
    @id: 1
    @loc: 11:3:11:10
    @status: to be proved
    @obl: ASSUME NEW VARIABLE x
    PROVE  Op' => Op'

    @type: obligationsnumber
    @count: 1
---*)

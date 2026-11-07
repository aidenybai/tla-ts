(*---
description: Primes and UNCHANGED in an ASSUME hypothesis print as written.
ref: src/expr/e_fmt.ml#pp_print_hyp
mode: obligations
outcome: proved
---*)
---- MODULE action_operators_in_assume ----
VARIABLES x, y
THEOREM ASSUME x' = 1, UNCHANGED y PROVE x' = 1
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
           NEW VARIABLE y,
           x' = 1 ,
           UNCHANGED y 
    PROVE  x' = 1

    @type: obligationsnumber
    @count: 1
---*)

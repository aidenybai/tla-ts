(*---
description: tlapm does not check that a variable is primed at most once, so ENABLED x'' is accepted.
ref: src/expr/e_levels.ml#level_computation
mode: obligations
outcome: proved
---*)
---- MODULE double_prime_in_enabled_accepted ----
VARIABLE x
THEOREM ENABLED x'' OBVIOUS
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    @type: obligation
    @id: 1
    @loc: 9:21:9:28
    @status: to be proved
    @obl: ASSUME NEW VARIABLE x
    PROVE  ENABLED (x'')

    @type: obligationsnumber
    @count: 1
---*)

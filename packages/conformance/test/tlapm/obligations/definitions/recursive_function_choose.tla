(*---
description: A recursive function definition is turned into a CHOOSE of a function equal to its constructor.
ref: src/expr/e_anon.ml#defn
mode: obligations
outcome: proved
---*)
---- MODULE recursive_function_choose ----
EXTENDS Naturals
f[n \in Nat] == IF n = 0 THEN 0 ELSE f[n - 1]
THEOREM f[0] = 0
  BY DEF f
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    @type: obligation
    @id: 1
    @loc: 11:3:11:5
    @status: to be proved
    @obl: ASSUME f == CHOOSE f : f = [n \in Nat |-> IF n = 0 THEN 0 ELSE f[n - 1]]
    PROVE  f[0] = 0

    @type: obligationsnumber
    @count: 1
---*)

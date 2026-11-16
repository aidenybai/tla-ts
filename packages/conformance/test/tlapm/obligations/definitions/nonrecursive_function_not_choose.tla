(*---
description: A function definition that does not mention itself stays a function constructor.
ref: src/expr/e_anon.ml#defn
mode: obligations
outcome: proved
---*)
---- MODULE nonrecursive_function_not_choose ----
EXTENDS Naturals
f[n \in Nat] == n + 1
THEOREM f[0] = 1
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
    @obl: ASSUME f == [n \in Nat |-> n + 1]
    PROVE  f[0] = 1

    @type: obligationsnumber
    @count: 1
---*)

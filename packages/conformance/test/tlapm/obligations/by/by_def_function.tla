(*---
description: A function definition made visible by DEF prints as a function constructor.
ref: src/expr/e_fmt.ml#pp_print_defn
mode: obligations
outcome: proved
---*)
---- MODULE by_def_function ----
EXTENDS Naturals
f[n \in Nat] == n
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
    @obl: ASSUME f == [n \in Nat |-> n]
    PROVE  f[0] = 0

    @type: obligationsnumber
    @count: 1
---*)

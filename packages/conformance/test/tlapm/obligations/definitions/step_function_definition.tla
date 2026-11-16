(*---
description: A function definition in a step prints as a function constructor.
ref: src/expr/e_fmt.ml#pp_print_defn
mode: obligations
outcome: proved
---*)
---- MODULE step_function_definition ----
CONSTANT S
THEOREM TRUE
<1> f[x \in S] == x
<1> QED
  OBVIOUS
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    @type: obligation
    @id: 1
    @loc: 12:3:12:10
    @status: to be proved
    @obl: ASSUME NEW CONSTANT S,
           f == [x \in S |-> x]
    PROVE  TRUE

    @type: obligationsnumber
    @count: 1
---*)

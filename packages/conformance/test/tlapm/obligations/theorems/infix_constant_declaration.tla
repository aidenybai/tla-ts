(*---
description: A declared infix constant operator _++_ appears in the context with its shape.
ref: src/expr/e_fmt.ml#pp_print_hyp
mode: obligations
outcome: proved
---*)
---- MODULE infix_constant_declaration ----
CONSTANT _++_
THEOREM 1 ++ 2 = 1 ++ 2
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
    @obl: ASSUME NEW CONSTANT ++(_, _)
    PROVE  1 ++ 2 = 1 ++ 2

    @type: obligationsnumber
    @count: 1
---*)

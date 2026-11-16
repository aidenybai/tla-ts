(*---
description: A declared constant operator F(_, _) appears in the context as NEW CONSTANT F(_, _).
ref: src/expr/e_fmt.ml#pp_print_hyp
mode: obligations
outcome: proved
---*)
---- MODULE operator_constant_declaration ----
CONSTANT F(_, _), G(_)
THEOREM F(1, 2) = G(3)
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
    @obl: ASSUME NEW CONSTANT F(_, _),
           NEW CONSTANT G(_)
    PROVE  F(1, 2) = G(3)

    @type: obligationsnumber
    @count: 1
---*)

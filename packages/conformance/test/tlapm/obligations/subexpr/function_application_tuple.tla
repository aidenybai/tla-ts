(*---
description: "For f[a, b], the second subexpression is the tuple of arguments."
ref: src/expr/e_deref.ml#deref_num
mode: obligations
outcome: proved
---*)
---- MODULE function_application_tuple ----
CONSTANT f, a, b
Op == f[a, b]
THEOREM Op!2 = <<a, b>>
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
    @obl: ASSUME NEW CONSTANT f,
           NEW CONSTANT a,
           NEW CONSTANT b
    PROVE  <<a, b>> = <<a, b>>

    @type: obligationsnumber
    @count: 1
---*)

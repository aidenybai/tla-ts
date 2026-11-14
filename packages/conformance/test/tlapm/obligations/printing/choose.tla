(*---
description: CHOOSE prints with its bound and body.
ref: src/expr/e_fmt.ml#fmt_expr
mode: obligations
outcome: proved
---*)
---- MODULE choose ----
CONSTANT S
THEOREM (CHOOSE x \in S : TRUE) = (CHOOSE y : y \in S)
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
    @obl: ASSUME NEW CONSTANT S
    PROVE  (CHOOSE x \in S : TRUE) = (CHOOSE y : y \in S)

    @type: obligationsnumber
    @count: 1
---*)

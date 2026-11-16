(*---
description: A function of two arguments prints with both bounds, and its application with both arguments.
ref: src/expr/e_fmt.ml#fmt_expr
mode: obligations
outcome: proved
---*)
---- MODULE function_multiple_arguments ----
CONSTANT S
THEOREM [x, y \in S |-> x][CHOOSE s \in S : TRUE, CHOOSE s \in S : TRUE] \in S
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
    PROVE  [x, y \in S |-> x][CHOOSE s \in S : TRUE, CHOOSE s \in S : TRUE] \in S

    @type: obligationsnumber
    @count: 1
---*)

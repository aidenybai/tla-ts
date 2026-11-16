(*---
description: Function constructors, application, DOMAIN and function sets print in TLA+ syntax.
ref: src/expr/e_fmt.ml#fmt_expr
mode: obligations
outcome: proved
---*)
---- MODULE functions ----
CONSTANT S, T
THEOREM [x \in S |-> x][CHOOSE s \in S : TRUE] \in DOMAIN [S -> T]
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
    @obl: ASSUME NEW CONSTANT S,
           NEW CONSTANT T
    PROVE  [x \in S |-> x][CHOOSE s \in S : TRUE] \in DOMAIN [S -> T]

    @type: obligationsnumber
    @count: 1
---*)

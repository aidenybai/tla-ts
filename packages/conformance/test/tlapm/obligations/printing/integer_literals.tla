(*---
description: Integer arithmetic prints with the parentheses that tlapm's operator precedences give, so % groups the sum before it.
ref: src/expr/e_fmt.ml#fmt_expr
mode: obligations
outcome: proved
---*)
---- MODULE integer_literals ----
EXTENDS Integers
THEOREM -1 + 2 * 3 \div 4 % 5 - 6 ^ 2 \in Int /\ 1..3 \subseteq Nat
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
    @obl: ((-1 + 2 * (3 \div 4)) % 5) - 6 ^ 2 \in Int /\ 1..3 \subseteq Nat

    @type: obligationsnumber
    @count: 1
---*)

(*---
description: An infix Naturals operator can be passed as an operator argument.
ref: tlc2/value/impl/MethodValue.java#eval
features:
  - Naturals
flags:
  - expression
outcome: success
---*)
---- MODULE naturals_operator_as_argument ----
EXTENDS Naturals
Apply(Op(_, _), a, b) == Op(a, b)
Test == Apply(+, 1, 2) = 3 /\ Apply( * , 2, 3) = 6
====

(*--- recorded
all:
  exit: 0
---*)

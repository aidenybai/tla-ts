(*---
description: Prefix minus can be passed as an operator argument, spelled -. .
ref: tlc2/module/Integers.java#Neg
features:
  - Integers
flags:
  - expression
outcome: success
---*)
---- MODULE neg_as_operator_argument ----
EXTENDS Integers
Apply(Op(_), a) == Op(a)
Test == Apply(-., 3) = -3
====

(*--- recorded
all:
  exit: 0
---*)

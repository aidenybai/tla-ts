(*---
description: "A function may be applied with a tuple, as function arity is not operator arity."
ref: "tla2sany/semantic/Generator.java#generateExpressionOrLAP"
features: [higher_arity]
flags: [expression]
outcome: success
---*)
---- MODULE function_arity_not_operator_arity ----
f[a \in {1}, b \in {2}] == a
Test == f[<<1, 2>>] = 1 /\ f[1, 2] = 1
====

(*--- recorded
all:
  exit: 0
---*)

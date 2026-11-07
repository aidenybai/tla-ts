(*---
description: Evaluates a random record expression, seed 262, number 6364.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06364 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[(CHOOSE r \in [a : {1, 2} \ {1}] : TRUE) EXCEPT !.a = @ + (-Cardinality({x \in 1..3 : x > 1}))] EXCEPT !.a = (CHOOSE b9785 \in ((3 + 2147483647) .. (-3)) : (Cardinality(TRUE) = CASE TRUE -> 1 [] OTHER -> b9785))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2178:0 Overflow when computing 3+2147483647
    2178:0 Overflow when computing 3+2147483647
---*)

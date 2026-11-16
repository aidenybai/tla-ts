(*---
description: Evaluates a random record expression, seed 262, number 684.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00684 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[(CHOOSE r \in [a : {1, 2} \ {1}] : TRUE) EXCEPT !.a = LET b1143 == (2147483647 % 2147483647) IN Head(<<1>>)] EXCEPT !.a = @ + (((-1)[1] * (0 - 2)) * ((CHOOSE b1144 \in SUBSET {1} : FALSE) * LET b1145 == 0 IN 2147483647))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00684 failed.
    A non-function (an integer) was applied as a function.
    line 14, col 146 to line 14, col 152 of module random_00684
---*)

(*---
description: Evaluates a random bool expression, seed 262, number 8254.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08254 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((\E b12770 \in UNION {{IF TRUE THEN b12771 ELSE b12771 : b12771 \in DOMAIN <<5, 6>>}, ((-2))[IF FALSE THEN [a |-> 1] ELSE 2]} : (({2, 2147483647} \cup (b12770 .. 0)) \cap DOMAIN [b12772 \in 1..3 |-> -1])))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08254 failed.
    A non-function (an integer) was applied as a function.
    line 14, col 102 to line 14, col 139 of module random_08254
---*)

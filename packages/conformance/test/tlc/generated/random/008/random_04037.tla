(*---
description: Evaluates a random set expression, seed 262, number 4037.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04037 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(DOMAIN [[(CHOOSE f \in [{1, 2} \ {1} -> {1}] : TRUE) EXCEPT ![(3 * 1)] = (2147483647 * 0)] EXCEPT ![((2 - 2147483647) % IF TRUE THEN -1 ELSE 1)] = ((CHOOSE r \in [a : {0} \cup {1}] : TRUE)).a])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 26 to line 14, col 66 of module random_04037
    2169:0 The second argument of % should be a positive number, but instead it is:
    -1
    2169:0 The second argument of % should be a positive number, but instead it is:
    -1
---*)

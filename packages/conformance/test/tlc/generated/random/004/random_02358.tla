(*---
description: Evaluates a random seq expression, seed 262, number 2358.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02358 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(<<IF (<<-1, 0>> = (2147483647 :> 2147483647)) THEN ({2, 2147483647} \cap {b3734 \in Nat : FALSE}) ELSE ((-1 % 0) * LET b3735 == {1, 2} IN TRUE), (((CHOOSE f \in [{2, 1, 3} -> {0} \cup {1}] : TRUE))[Head(<<1, 2>>)] - ({b3736 : b3736 \in 3} \ ({2, 1, 3} \ {1})))>>)
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02358 failed.
    2169:0 The second argument of % should be a positive number, but instead it is:
    0
---*)

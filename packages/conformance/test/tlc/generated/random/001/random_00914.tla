(*---
description: Evaluates a random seq expression, seed 262, number 914.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00914 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Append(SortSeq(((CHOOSE f \in [{1, 2} \cap {2} -> {2, 1, 3}] : TRUE))[(-1 * 2147483647)], LAMBDA p, q : p < q), CASE (\E b1472 \in {7 : b1473 \in 1..3} : (b1472 :> b1472)) -> (([a |-> 1]).a \div (1 + -1)) [] OTHER -> Len((TRUE \/ TRUE))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00914 failed.
    Attempted to apply function:
    (2 :> 1)
    to argument -2147483647, which is not in the domain of the function.
---*)

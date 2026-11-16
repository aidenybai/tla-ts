(*---
description: Evaluates a random seq expression, seed 262, number 8076.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08076 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((DOMAIN [[(1 :> 2) EXCEPT ![2147483647] = 7] EXCEPT ![Head(<<1, 2>>)] = (FALSE <=> TRUE)] \cap {b12483 \in (({1} \ {}) \ ({} \cap {1})) : (({2, 1, 3} \subseteq {x \in 1..3 : x > 1}) <=> (~TRUE))}))
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 27 to line 14, col 32 of module random_08076
    | {1}
---*)

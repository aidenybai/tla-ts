(*---
description: Evaluates a random set expression, seed 262, number 1066.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01066 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({Head(Tail((FALSE /\ FALSE))) : b1706 \in (UNION {(-1 .. -1), (0 :> 3)} \ {b1707 \in {0, -1} : (\E b1708 \in {2, 1, 3} : [x \in Nat |-> x + 1])})})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01066 failed.
    2215:0 TLC expected a boolean value, but did not find one. line 14, col 112 to line 14, col 157 of module random_01066
---*)

(*---
description: Evaluates a random bool expression, seed 262, number 8086.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08086 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((DOMAIN <<5, 6>> \cap ({x \in 1..3 : x > 1} \cap SUBSET {1})) \ ((1..3 \ {1}) \cap {2147483647, 1})) \subseteq [SelectSeq(<<3, 0>>, LAMBDA e : e > 0) EXCEPT ![1] = (IF FALSE THEN 0 ELSE -1 \div ((1 :> 2))[2147483647])]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08086 failed.
    Attempted to check if the non-enumerable value
    2
    is element of
    {{}, {1}}
---*)

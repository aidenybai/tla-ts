(*---
description: Evaluates a random record expression, seed 262, number 9702.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09702 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a |-> (-(LET b15052 == 1 IN 2147483647 - LET b15053 == 1 IN b15053)), b |-> ((({} \cap {x \in 1..3 : x > 1}) = {b15054 \in 2..1 : FALSE}) <=> (DOMAIN [a |-> 1, b |-> TRUE] \subseteq (SUBSET {1} \cap {1})))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09702 failed.
    Attempted to check if the non-enumerable value
    1
    is element of
    {{}, {1}}
---*)

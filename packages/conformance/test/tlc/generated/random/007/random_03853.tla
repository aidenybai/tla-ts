(*---
description: Evaluates a random set expression, seed 262, number 3853.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03853 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(UNION {DOMAIN [(<<5, 6>> @@ <<5, 6>>) EXCEPT ![([a |-> 1]).a] = LET b6067 == 1 IN b6067], ({b6068 \in DOMAIN (1 :> 2) : ([a |-> 1] = [a |-> 1])} \ UNION {DOMAIN [x \in 1..2 |-> x], {b6069 \in [a |-> 1, b |-> TRUE] : FALSE}})})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03853 failed.
    Attempted to enumerate { x \in S : p(x) } when S:
    [a |-> 1, b |-> TRUE]
    is not enumerable
---*)

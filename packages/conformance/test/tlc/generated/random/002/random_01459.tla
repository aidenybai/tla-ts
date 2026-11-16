(*---
description: Evaluates a random set expression, seed 262, number 1459.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01459 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({(-Cardinality({1})) : b2330 \in (UNION {{2, 1, 3}, [x \in 1..2 |-> x]} \ {b2331 \in Nat : FALSE})} \ (((3 .. 0) \ [<<5, 6>> EXCEPT ![0] = 7]) \cup {(1 % b2332) : b2332 \in {b2333 : b2333 \in {x \in 1..3 : x > 1}}})))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01459 failed.
    Attempted to compare the function <<1, 2>> with the value:
    {1, 2, 3}
---*)

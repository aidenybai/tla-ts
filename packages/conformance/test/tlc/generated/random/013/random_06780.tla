(*---
description: Evaluates a random set expression, seed 262, number 6780.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06780 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({Head(<<([x \in 1..2 |-> x])[0], CASE TRUE -> Nat [] OTHER -> 2>>), (((2147483647 :> 2) @@ [b10397 \in Nat |-> 2147483647]))[[([x \in 1..2 |-> x] @@ <<5, 6>>) EXCEPT ![({} \cap {1, 2})] = (-1)]]})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06780 failed.
    In applying the function
    <<1, 2>>,
    the first argument is:
    0
    which is not in its domain.
---*)

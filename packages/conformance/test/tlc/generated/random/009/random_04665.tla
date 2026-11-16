(*---
description: Evaluates a random function expression, seed 262, number 4665.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04665 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([b7289 \in ((({2, 1, 3} \cap SUBSET {1}) \cap DOMAIN [x \in 1..2 |-> x]) \cup DOMAIN [<<3, 1, 2>> EXCEPT ![1] = 2147483647]) |-> (LET b7290 == Len(<<>>) IN CASE TRUE -> b7289 [] OTHER -> b7290 * (([x \in Nat |-> x + 1])[3] + (b7289 - b7289)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04665 failed.
    Attempted to check if the non-enumerable value
    2
    is element of
    {{}, {1}}
---*)

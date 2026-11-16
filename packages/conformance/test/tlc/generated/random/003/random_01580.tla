(*---
description: Evaluates a random set expression, seed 262, number 1580.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01580 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({b2521 \in ({b2522 \in (0 .. -1) : (<<1, 2>> = [x \in Nat |-> x + 1])} \ (({2, 1, 3} \cap 1..3) \ ({x \in 1..3 : x > 1} \cap SUBSET {1}))) : ((-(7 \div b2521)) \in ((3 - b2521) .. (0 * b2521)))})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01580 failed.
    Attempted to check if the non-enumerable value
    2
    is element of
    {{}, {1}}
---*)

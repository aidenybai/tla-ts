(*---
description: Evaluates a random function expression, seed 262, number 7057.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07057 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((CHOOSE f \in [{1, 2} -> {1, 2}] : TRUE))[Head(SelectSeq(<<3, 1, 2>>, LAMBDA e : e > 0))] :> (((2 + 0) \div ([x \in Nat |-> x + 1])[2147483647]) % (([a |-> 1, b |-> TRUE])[2147483647] % CASE TRUE -> 1 [] OTHER -> -1))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07057 failed.
    Attempted to apply function:
    <<1, 1>>
    to argument 3, which is not in the domain of the function.
---*)

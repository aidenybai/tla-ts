(*---
description: Evaluates a random set expression, seed 262, number 4644.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04644 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([(CHOOSE f \in [{1, 2} -> {1, 2} \ {1}] : TRUE) EXCEPT ![(((7 % 2) = ((1 :> 2))[7]) \div ((0 + [a |-> 1]) % ([x \in Nat |-> x + 1])[2]))] = (Head(Tail(<<1, 2>>)) * (-CASE FALSE -> 2147483647 [] OTHER -> 2147483647))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04644 failed.
    Attempted to apply function:
    <<2>>
    to argument 7, which is not in the domain of the function.
---*)

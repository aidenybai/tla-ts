(*---
description: Evaluates a random function expression, seed 262, number 9498.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09498 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Head(SortSeq(Tail(<<1, 2>>), LAMBDA p, q : p < q)) :> ((([x \in Nat |-> x + 1])[2147483647] % (7 % 7)) \div CASE (1 < <<5, 6>>) -> (0 + -1) [] OTHER -> (3 + 2))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09498 failed.
    2178:0 Overflow when computing 2147483647+1
---*)

(*---
description: Evaluates a random seq expression, seed 262, number 3410.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03410 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([Tail(<<(2 + 7), IF FALSE THEN 2 ELSE 7>>) EXCEPT ![1] = (-(([x \in Nat |-> x + 1])[2147483647] \div CASE <<1>> -> -1 [] OTHER -> 7))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2178:0 Overflow when computing 2147483647+1
    2178:0 Overflow when computing 2147483647+1
---*)

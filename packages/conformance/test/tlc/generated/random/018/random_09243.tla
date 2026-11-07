(*---
description: Evaluates a random bool expression, seed 262, number 9243.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09243 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((IF ((<<>> = [x \in 1..2 |-> x]) => (\E b14349 \in 2..1 : FALSE)) THEN (([x \in Nat |-> x + 1])[2147483647] - (0 * 2)) ELSE ((2147483647 - 3) \div Head(<<>>)) = ((-(7 - -1)) \div ((CHOOSE b14350 \in {1} : FALSE) + DOMAIN [x \in 1..2 |-> x]))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2178:0 Overflow when computing 2147483647+1
    2178:0 Overflow when computing 2147483647+1
---*)

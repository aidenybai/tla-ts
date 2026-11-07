(*---
description: Evaluates a random bool expression, seed 262, number 2510.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02510 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((({} \subseteq {x \in 1..3 : x > 1}) => (\E b3960 \in 1..3 : {1})) => (\E b3961 \in (7 .. 2147483647) : (b3961 < b3961))) => (([b3962 \in {1} |-> b3962])[CASE FALSE -> 7 [] OTHER -> 2147483647] \in {b3963 \in (2147483647 .. 2) : (7 < 2)})))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2215:0 TLC expected a boolean value, but did not find one. line 14, col 59 to line 14, col 81 of module random_02510
    2215:0 TLC expected a boolean value, but did not find one. line 14, col 59 to line 14, col 81 of module random_02510
---*)

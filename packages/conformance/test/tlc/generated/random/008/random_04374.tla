(*---
description: Evaluates a random bool expression, seed 262, number 4374.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04374 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((<<([x \in Nat |-> x + 1])[2147483647], CASE FALSE -> 0 [] OTHER -> 1>> \o [[<<3, 1, 2>> EXCEPT ![1] = 1] EXCEPT ![1] = (-0)]) <=> (((\A b6892 \in 1..3 : TRUE) \/ (TRUE <=> [x \in 1..2 |-> x])) \/ ((7 % 0) \in {b6893 \in {2, 1, 3} : TRUE}))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2178:0 Overflow when computing 2147483647+1
    2178:0 Overflow when computing 2147483647+1
---*)

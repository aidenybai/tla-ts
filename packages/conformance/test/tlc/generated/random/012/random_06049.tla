(*---
description: Evaluates a random bool expression, seed 262, number 6049.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06049 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((([b9319 \in Nat |-> b9319])[([x \in Nat |-> x + 1])[2147483647]] + Len((<<1>> \o <<1, 2>>))) = ((CASE TRUE -> 3 [] OTHER -> -1 + Cardinality(1..3)) * (Head(<<1>>) + (-2)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2178:0 Overflow when computing 2147483647+1
    2178:0 Overflow when computing 2147483647+1
---*)

(*---
description: Evaluates a random function expression, seed 262, number 1355.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01355 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[b2161 \in (Len(<<1>>) .. Len(<<1>>)) |-> Len(SortSeq(<<3, 1, 2>>, LAMBDA p, q : p < q))] EXCEPT ![((CASE FALSE -> TRUE [] OTHER -> 2 + (2147483647 + -1)) \div ((2 % 7) + (-0)))] = (((7)[[a |-> 1, b |-> TRUE]] - (0 \div 2)) * (Len(<<3, 1, 2>>) + (1 + 1)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2178:0 Overflow when computing 2+2147483646
    2178:0 Overflow when computing 2+2147483646
---*)

(*---
description: Evaluates a random bool expression, seed 262, number 8640.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08640 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(<<(((-3) - (7 + 7)) * Len(Append(<<1, 2>>, 0))), (((2147483647 - -1) * ([x \in 1..2 |-> x])[1]) \div ({b13373 : b13373 \in {2, 1, 3}})[Head(<<3, 1, 2>>)])>>)
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2178:0 Overflow when computing 2147483647--1
    2178:0 Overflow when computing 2147483647--1
---*)

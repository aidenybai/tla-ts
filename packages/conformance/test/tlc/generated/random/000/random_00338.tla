(*---
description: Evaluates a random int expression, seed 262, number 338.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00338 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Head(SubSeq(<<(2147483647 * 3), (-1 % TRUE)>>, Head([<<3, 1, 2>> EXCEPT ![1] = 0]), (Append(<<1>>, <<5, 6>>) * ([a |-> 1, b |-> TRUE]).a))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2178:0 Overflow when computing 2147483647*3
    2178:0 Overflow when computing 2147483647*3
---*)

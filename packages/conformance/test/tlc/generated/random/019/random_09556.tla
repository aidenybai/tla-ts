(*---
description: Evaluates a random int expression, seed 262, number 9556.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09556 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((-IF ((~TRUE) <=> ([a |-> 1, b |-> TRUE] = [a |-> 1])) THEN CASE (7 = -1) -> ([x \in 1..2 |-> x])[2147483647] [] OTHER -> (0 % -1) ELSE (-(-1 - 1))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2169:0 The second argument of % should be a positive number, but instead it is:
    -1
    2169:0 The second argument of % should be a positive number, but instead it is:
    -1
---*)

(*---
description: Evaluates a random int expression, seed 262, number 7775.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07775 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(IF (([[x \in 1..2 |-> x] EXCEPT ![3] = 0])[([a |-> 1]).a] = ((2 \div 1) * Len(<<1, 2>>))) THEN IF ((0 - 7) \in {b11994 \in {x \in 1..3 : x > 1} : FALSE}) THEN ((0 - 2147483647) + (3 % 1)) ELSE ((7 = 3) => ([a |-> 1] = [a |-> 1, b |-> TRUE])) ELSE Head(Tail(SelectSeq(<<1, 2>>, LAMBDA e : e > 0))))
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 22 to line 14, col 39 of module random_07775
    | 2
---*)

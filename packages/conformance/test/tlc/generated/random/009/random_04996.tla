(*---
description: Evaluates a random function expression, seed 262, number 4996.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04996 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((IF (FALSE \/ FALSE) THEN (0 % 3) ELSE ([x \in Nat |-> x + 1])[2] % LET b7775 == (2 - 7) IN (b7775 % b7775)) :> IF ((0 * [x \in Nat |-> x + 1]) :> (FALSE % 3)) THEN [a |-> ([a |-> 1]).a, b |-> (TRUE => FALSE)] ELSE Head(Tail(<<>>))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2169:0 The second argument of % should be a positive number, but instead it is:
    -5
    2169:0 The second argument of % should be a positive number, but instead it is:
    -5
---*)

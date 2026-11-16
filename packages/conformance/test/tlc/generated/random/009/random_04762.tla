(*---
description: Evaluates a random seq expression, seed 262, number 4762.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04762 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((([(CHOOSE r \in [a : {1, 2}] : TRUE) EXCEPT !.a = @ + Len(<<>>)] = [a |-> (-0), b |-> (\E b7432 \in 2..1 : TRUE)]) => (~((-2147483647) < (2147483647 % 3)))))
====

(*--- recorded
all:
  exit: 0
  transcript: "| TRUE"
---*)

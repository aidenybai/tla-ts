(*---
description: Evaluates a random bool expression, seed 262, number 7707.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07707 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((CHOOSE r \in [a : {2, 1, 3}] : TRUE) = [a |-> Head(Append(<<1>>, 2)), b |-> (\E b11885 \in {7, -1} : ({x \in 1..3 : x > 1} \subseteq 2..1))]))
====

(*--- recorded
all:
  exit: 0
  transcript: "| FALSE"
---*)

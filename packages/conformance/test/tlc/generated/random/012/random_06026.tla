(*---
description: Evaluates a random set expression, seed 262, number 6026.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06026 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(DOMAIN [b9285 \in ((7 % 3) .. (2 % 2)) |-> LET b9286 == (2147483647 \div b9285) IN ([a |-> 1] = [a |-> 1])])
====

(*--- recorded
all:
  exit: 0
  transcript: "| {}"
---*)

(*---
description: Evaluates a random function expression, seed 262, number 7932.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07932 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([b12246 \in (((2147483647 \div 2147483647) - (1 \div 2)) .. Head(Tail(<<1, 2>>))) |-> (((-1) - Head(<<1>>)) - Len([<<1>> EXCEPT ![1] = b12246]))])
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<-3, -3>>"
---*)

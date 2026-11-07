(*---
description: Evaluates a random set expression, seed 262, number 8151.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08151 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({b12603 \in {b12604 \in {-1, 7} : (b12604 < b12604)} : (Head(<<1>>) < (b12603 % 0))} \ {((0 - 0) + IF TRUE THEN 2147483647 ELSE -1), (-(-1 + 7))}))
====

(*--- recorded
all:
  exit: 0
  transcript: "| {}"
---*)

(*---
description: Evaluates a random set expression, seed 262, number 1224.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01224 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({Head(<<7, -1>>), (IF FALSE THEN 2147483647 ELSE 2147483647 * (1 \div 7))} \cap {((b1967 % 3) * (-b1967)) : b1967 \in ({b1968 : b1968 \in {}} \cap UNION {2..1, {2, 1, 3}})}))
====

(*--- recorded
all:
  exit: 0
  transcript: "| {}"
---*)

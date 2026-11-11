(*---
description: Evaluates a random bool expression, seed 262, number 9280.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09280 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((CHOOSE r \in [a : {1, 2}] : TRUE)).a < (-(-Head(<<1>>)))))
====

(*--- recorded
all:
  exit: 0
  transcript: "| FALSE"
---*)

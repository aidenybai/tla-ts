(*---
description: Evaluates a random set expression, seed 262, number 3641.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03641 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(DOMAIN (CHOOSE r \in [a : {1, 2}] : TRUE))
====

(*--- recorded
all:
  exit: 0
  transcript: '| {"a"}'
---*)

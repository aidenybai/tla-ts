(*---
description: Evaluates a random set expression, seed 262, number 8084.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08084 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({Cardinality({Head(<<1>>), ([a |-> 1]).a}), ((CHOOSE r \in [a : {1}] : TRUE)).a})
====

(*--- recorded
all:
  exit: 0
  transcript: "| {1}"
---*)

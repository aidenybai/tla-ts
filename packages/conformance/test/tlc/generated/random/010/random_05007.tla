(*---
description: Evaluates a random seq expression, seed 262, number 5007.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05007 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(<<((([x \in Nat |-> x + 1])[7] + Len(<<>>)) \div ([b7791 \in {1, 2} |-> 1])[Head(<<1>>)]), Head([Append(<<1, 2>>, 1) EXCEPT ![1] = (1 - 2)])>>)
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<8, -1>>"
---*)

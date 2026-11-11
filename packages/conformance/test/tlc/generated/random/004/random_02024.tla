(*---
description: Evaluates a random seq expression, seed 262, number 2024.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02024 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(<<CASE ((TRUE => TRUE) => (\A b3213 \in {} : FALSE)) -> Len(<<1, Nat>>) [] OTHER -> LET b3214 == (3).a IN (<<5, 6>>)[2147483647], Len([Tail(<<1, 2>>) EXCEPT ![1] = ([x \in Nat |-> x + 1])[7]])>>)
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<2, 1>>"
---*)

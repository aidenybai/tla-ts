(*---
description: Evaluates a random int expression, seed 262, number 2193.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02193 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((-((Cardinality(Nat) :> Append(<<1, 2>>, 7)))[IF (1 < 2147483647) THEN Len(<<>>) ELSE (-1 \div 2)]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2181:0 Attempted to compute cardinality of the value
    Nat
    2181:0 Attempted to compute cardinality of the value
    Nat
---*)

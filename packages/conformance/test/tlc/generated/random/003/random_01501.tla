(*---
description: Evaluates a random function expression, seed 262, number 1501.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01501 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([b2393 \in [Tail([<<1, 2>> EXCEPT ![1] = 2147483647]) EXCEPT ![1] = Cardinality(DOMAIN [x \in Nat |-> x + 1])] |-> ((Len(<<1, 2>>) + (2147483647 % b2393)) - ((b2393 + b2393) - (3 - b2393)))])
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

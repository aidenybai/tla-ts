(*---
description: Evaluates a random seq expression, seed 262, number 1698.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01698 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Tail(Tail((Append(<<3, 1, 2>>, -1) \o ([x \in Nat |-> x + 1])[3]))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2182:0 Evaluating an expression of the form t \o s when s is not a sequence:
    4
    2182:0 Evaluating an expression of the form t \o s when s is not a sequence:
    4
---*)

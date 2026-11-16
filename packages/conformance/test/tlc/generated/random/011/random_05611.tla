(*---
description: Evaluates a random set expression, seed 262, number 5611.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05611 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({(-CASE Len(<<3, 1, 2>>) -> (b8685 % b8685) [] OTHER -> (2 \div b8685)) : b8685 \in {([[a |-> 1, b |-> TRUE] EXCEPT ![0] = -1] \div (3 - 1)), ((<<1, 2>> \o <<3, 1, 2>>) * Cardinality(Nat))}})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05611 failed.
    Attempted to access record by a non-string argument: 0
---*)

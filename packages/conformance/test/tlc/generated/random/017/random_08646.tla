(*---
description: Evaluates a random record expression, seed 262, number 8646.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08646 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a |-> (Head(Tail(<<>>)) + Cardinality((<<3, 1, 2>> \o <<1>>))), b |-> ({(0 + 0), Len(7)} \subseteq {LET b13382 == 7 IN b13382, CASE TRUE -> 7 [] OTHER -> 2147483647})])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2184:0 Attempted to apply Tail to the empty sequence.
    2184:0 Attempted to apply Tail to the empty sequence.
---*)

(*---
description: Evaluates a random int expression, seed 262, number 9847.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09847 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Tail(<<IF ([a |-> 1, b |-> TRUE] = [a |-> 1, b |-> TRUE]) THEN (<<5, 6>> @@ (1 :> 2)) ELSE Len(<<1>>), Cardinality(UNION {{1, 2}, {x \in 1..3 : x > 1}})>>))
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<3>>"
---*)

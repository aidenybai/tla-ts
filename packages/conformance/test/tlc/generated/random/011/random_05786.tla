(*---
description: Evaluates a random int expression, seed 262, number 5786.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05786 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((((CHOOSE r \in [a : {1, 2} \ {1}] : TRUE)).a - LET b8919 == ([x \in 1..2 |-> x])[2147483647] IN Len(<<3, 1, 2>>)) - IF (\E b8920 \in {1, -1} : (2147483647 \in {x \in 1..3 : x > 1})) THEN ((\A b8921 \in 1..3 : TRUE) => (2..1 \subseteq {x \in 1..3 : x > 1})) ELSE Head(SelectSeq(<<1, 2>>, LAMBDA e : e > 0))))
====

(*--- recorded
all:
  exit: 0
  transcript: "| -2"
---*)

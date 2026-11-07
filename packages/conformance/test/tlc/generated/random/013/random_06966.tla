(*---
description: Evaluates a random bool expression, seed 262, number 6966.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06966 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({b10658 \in {(3 + 2147483647), Head(<<1, 2>>)} : ((b10658 \in Nat) => ({2, 1, 3} \subseteq 2..1))} = {(Head(<<1, 2>>) \div Cardinality({1, 2})) : b10659 \in ((-2147483647) .. IF FALSE THEN -1 ELSE 2)}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2178:0 Overflow when computing 3+2147483647
    2178:0 Overflow when computing 3+2147483647
---*)

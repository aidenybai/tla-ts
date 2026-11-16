(*---
description: Evaluates a random bool expression, seed 262, number 1182.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01182 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((((7 % 7) \div Len(<<3, 1, 2>>)) \cap {([a |-> 1]).a, Len(<<3, 1, 2>>)}) \subseteq {IF (TRUE /\ FALSE) THEN (b1894 + 2147483647) ELSE CASE TRUE -> 2 [] OTHER -> b1894 : b1894 \in (Len(<<3, 1, 2>>) .. Cardinality({1}))}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01182 failed.
    Attempted to check if the value:
    1
    is an element of the integer 0
---*)

(*---
description: Evaluates a random record expression, seed 262, number 1837.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01837 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a |-> CASE ((0 = 2147483647) => (TRUE \/ FALSE)) -> LET b2909 == CASE TRUE -> <<5, 6>> [] OTHER -> 3 IN ([a |-> 1, b |-> TRUE]).a [] OTHER -> (CASE TRUE -> 2147483647 [] OTHER -> 2147483647 * LET b2910 == 7 IN 0), b |-> (((7 - 0) .. Cardinality(Nat)) \subseteq (UNION {{x \in 1..3 : x > 1}, {1}} \cup ({x \in 1..3 : x > 1} \ {x \in 1..3 : x > 1})))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01837 failed.
    2181:0 Attempted to compute cardinality of the value
    Nat
---*)

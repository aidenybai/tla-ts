(*---
description: Evaluates a random int expression, seed 262, number 5188.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05188 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([b8044 \in {LET b8045 == 1 IN 1, Len(<<3, 1, 2>>)} |-> (-IF FALSE THEN 7 ELSE b8044)])[IF (\A b8046 \in UNION {Nat, {}} : (<<>> = [x \in Nat |-> x + 1])) THEN Len(<<2, 2147483647>>) ELSE Cardinality(UNION {1..3, Nat})])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05188 failed.
    Attempted to compare the set {} with the value:
    Nat
---*)

(*---
description: Evaluates a random seq expression, seed 262, number 1116.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01116 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Tail((IF (TRUE /\ [a |-> 1, b |-> TRUE]) THEN (2 * 7) ELSE ([x \in 1..2 |-> x] @@ [x \in 1..2 |-> x]) \cup {CASE TRUE -> 2147483647 [] OTHER -> 2147483647, Cardinality({1, 2})})))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01116 failed.
    Attempted to evaluate an expression of form P /\ Q when Q was
    a record.
    line 14, col 26 to line 14, col 54 of module random_01116
---*)

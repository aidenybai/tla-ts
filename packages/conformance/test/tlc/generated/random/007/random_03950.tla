(*---
description: Evaluates a random function expression, seed 262, number 3950.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03950 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[b6214 \in UNION {{b6215 : b6215 \in 1..3}, ({1, 2} \cup Nat)} |-> ((\E b6216 \in {2, 1, 3} : FALSE) - Cardinality(1..3))] EXCEPT ![([a |-> (-2147483647), b |-> (1 \in {1})]).a] = (Len(Tail(<<1, 2>>)) + (Head(<<1>>) * (0 - 2)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03950 failed.
    Attempted to enumerate S \cup T when S:
    {1, 2}
    and T:
    Nat
    are not both enumerable
---*)

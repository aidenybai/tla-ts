(*---
description: Evaluates a random int expression, seed 262, number 7032.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07032 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[[a |-> (-7), b |-> (Nat = {1})] EXCEPT !.a = IF Tail(<<1>>) THEN (1 + 2) ELSE CASE FALSE -> 2 [] OTHER -> 2147483647] EXCEPT !.a = Len([Tail(<<1, 2>>) EXCEPT ![1] = Cardinality(1..3)])])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07032 failed.
    Attempted to compare overridden value Nat with non-overridden value:
    {1}
---*)

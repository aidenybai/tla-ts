(*---
description: Evaluates a random int expression, seed 262, number 3644.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03644 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((LET b5760 == (<<3, 1, 2>> % 7) IN (-2147483647) * Cardinality([1..3 EXCEPT ![7] = -1])) + Len(Append((<<1, 2>> \o <<1, 2>>), Cardinality(2..1)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03644 failed.
    Attempted to apply EXCEPT construct to the value 1..3.
---*)

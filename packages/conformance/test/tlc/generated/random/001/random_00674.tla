(*---
description: Evaluates a random int expression, seed 262, number 674.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00674 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((([[a |-> 1] EXCEPT !.a = 7]).a * LET b1127 == (CHOOSE f \in [{1, 2} -> {2, 1, 3}] : TRUE) IN Head(<<1>>)) \div [((\A b1128 \in 2 : FALSE) <=> [a |-> 7, b |-> [x \in Nat |-> x + 1]]) EXCEPT ![(Head(<<1, 2>>) + (0 % 2))] = (-Head(<<3, 1, 2>>))]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00674 failed.
    TLC encountered a non-enumerable quantifier bound
    2.
    2
---*)

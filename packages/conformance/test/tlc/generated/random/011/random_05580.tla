(*---
description: Evaluates a random int expression, seed 262, number 5580.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05580 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([a |-> IF UNION {2..1, {2, 1, 3}} THEN (7 * 0) ELSE IF FALSE THEN 0 ELSE 3, b |-> ((\E b8639 \in {} : TRUE) /\ (\E b8640 \in {1, 2} : FALSE))]).a)
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05580 failed.
    A non-boolean expression (a set of the form UNION  S) was used as the condition of an IF.
    line 14, col 24 to line 14, col 90 of module random_05580
---*)

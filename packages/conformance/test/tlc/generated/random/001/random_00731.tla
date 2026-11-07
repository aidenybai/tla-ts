(*---
description: Evaluates a random record expression, seed 262, number 731.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00731 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[a |-> IF (<<1, 2>> \o <<1>>) THEN CASE FALSE -> 3 [] OTHER -> 7 ELSE Cardinality({1}), b |-> ((0 * 7) \in (Nat \ SUBSET {1}))] EXCEPT !.a = (((0 * 2147483647) + (2147483647 \div [a |-> 1])) - ([a |-> 2147483647, b |-> FALSE]).a)])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00731 failed.
    A non-boolean expression (a tuple) was used as the condition of an IF.
    line 14, col 24 to line 14, col 102 of module random_00731
---*)

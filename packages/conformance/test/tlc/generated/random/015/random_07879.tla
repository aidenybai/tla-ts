(*---
description: Evaluates a random set expression, seed 262, number 7879.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07879 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({(((-1)[0] \div IF FALSE THEN TRUE ELSE [a |-> 1]) \div ((CHOOSE f \in [{1, 2} \cap {2} -> {0} \cup {1}] : TRUE))[(1 % 7)]), ((Cardinality({2, 1, 3}) - Len(<<1, 2>>)) + ([[a |-> 1, b |-> TRUE] EXCEPT !.a = @ + 2147483647])[CASE FALSE -> 0 [] OTHER -> 0])})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07879 failed.
    A non-function (an integer) was applied as a function.
    line 14, col 19 to line 14, col 25 of module random_07879
---*)

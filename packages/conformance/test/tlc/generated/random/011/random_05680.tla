(*---
description: Evaluates a random bool expression, seed 262, number 5680.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05680 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((IF UNION {IF FALSE THEN 3 ELSE 2147483647, (2147483647 .. 3)} THEN IF (FALSE => TRUE) THEN ([a |-> 1, b |-> TRUE]).a ELSE Len(<<3, 1, 2>>) ELSE ([a |-> 1, b |-> FALSE] = [a |-> -1, b |-> TRUE]) \in (({b8753 \in {1, 2} : FALSE} \ {[a |-> 1], 1}) \ {[[a |-> 1, b |-> TRUE] EXCEPT !.a = 7], (2 % 3)})))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05680 failed.
    A non-boolean expression (a set of the form UNION  S) was used as the condition of an IF.
    line 14, col 17 to line 14, col 313 of module random_05680
---*)

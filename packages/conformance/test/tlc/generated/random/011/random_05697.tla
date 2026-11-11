(*---
description: Evaluates a random seq expression, seed 262, number 5697.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05697 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((IF (([a |-> 1] = [a |-> 1, b |-> TRUE]) \/ (SUBSET {1} <=> FALSE)) THEN ((2 % 0) - (7 + 2)) ELSE ([[a |-> 1, b |-> TRUE] EXCEPT !.a = @ + 1]).a * LET b8773 == Len(<<0, 3>>) IN SortSeq(Append(<<>>, 2147483647), LAMBDA p, q : p < q)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05697 failed.
    Attempted to evaluate an expression of form P <=> Q when P or Q was not a boolean.
    line 14, col 61 to line 14, col 80 of module random_05697
---*)

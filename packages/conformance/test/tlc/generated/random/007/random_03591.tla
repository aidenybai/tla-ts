(*---
description: Evaluates a random int expression, seed 262, number 3591.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03591 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Cardinality([a |-> IF FALSE THEN 7 ELSE 2147483647, b |-> (FALSE => TRUE)]) * LET b5662 == Tail(SubSeq(<<1, 2>>, 2, 1)) IN IF (1 = 1) THEN (7 % b5662) ELSE CASE TRUE -> 1 [] OTHER -> 2))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03591 failed.
    2181:0 Attempted to compute cardinality of the value
    [a |-> 2147483647, b |-> TRUE]
---*)

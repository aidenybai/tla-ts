(*---
description: Evaluates a random set expression, seed 262, number 8995.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08995 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((DOMAIN [[<<5, 6>> EXCEPT ![2] = [a |-> 1, b |-> TRUE]] EXCEPT ![Head(<<3, 1, 2>>)] = Cardinality(SUBSET {1})] \ ({b13972 \in {2147483647, 7} : (b13972 /\ TRUE)} \cup ((3 .. 2) \ {2147483647, 7}))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 25 to line 14, col 70 of module random_08995
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08995 failed.
    Attempted to evaluate an expression of form P /\ Q when P was
    an integer.
    line 14, col 161 to line 14, col 174 of module random_08995
---*)

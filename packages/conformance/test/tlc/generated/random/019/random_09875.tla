(*---
description: Evaluates a random set expression, seed 262, number 9875.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09875 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({b15344 \in ({b15345 \in {2, 1, 3} : {x \in 1..3 : x > 1}} \cup {FALSE, [a |-> 1, b |-> TRUE]}) : ((b15344 % 3) \in UNION {{1, 2}, <<>>})} \cap {b15346 \in {b15347 \in (-1 .. 2147483647) : ([a |-> 1] = [a |-> 1])} : (Cardinality(1..3) = (0 + 1))}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09875 failed.
    Attempted to evaluate an expression of form {x \in S : P(x)} when P was a set of the form {e1, ... ,eN}.
    line 14, col 54 to line 14, col 73 of module random_09875
---*)

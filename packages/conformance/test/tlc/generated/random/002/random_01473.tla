(*---
description: Evaluates a random set expression, seed 262, number 1473.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01473 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((DOMAIN Append(<<>>, 2147483647) \cap {b2353 \in (1..3 \cap {1, 2}) : (2..1 \cup {})}) \cup {b2354 \in (Append(<<1, 2>>, 1) * ([a |-> 1, b |-> TRUE]).a) : (Append(<<>>, 7) = [(1 :> 2) EXCEPT ![b2354] = 2])}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01473 failed.
    Attempted to evaluate an expression of form {x \in S : P(x)} when P was a set of the form {e1, ... ,eN}.
    line 14, col 88 to line 14, col 99 of module random_01473
---*)

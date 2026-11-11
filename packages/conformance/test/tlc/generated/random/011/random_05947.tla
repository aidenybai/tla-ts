(*---
description: Evaluates a random seq expression, seed 262, number 5947.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05947 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Tail(({([a |-> 1]).a : b9165 \in {b9166 \in {2, 1, 3} : b9166}} \cap (IF FALSE THEN [a |-> 1] ELSE 3 .. LET b9167 == 2147483647 IN b9167))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05947 failed.
    Attempted to evaluate an expression of form {x \in S : P(x)} when P was an integer.
    line 14, col 72 to line 14, col 76 of module random_05947
---*)

(*---
description: Evaluates a random bool expression, seed 262, number 9469.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09469 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((({([a |-> 1]).a, IF FALSE THEN 2147483647 ELSE 7} \cup DOMAIN [<<5, 6>> EXCEPT ![0] = 0]) => (~((0 .. -1) = ({x \in 1..3 : x > 1} \cup Nat)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 80 to line 14, col 87 of module random_09469
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09469 failed.
    Attempted to evaluate an expression of form P => Q when P was
    a set of the form {e1, ... ,eN}.
    line 14, col 17 to line 14, col 157 of module random_09469
---*)

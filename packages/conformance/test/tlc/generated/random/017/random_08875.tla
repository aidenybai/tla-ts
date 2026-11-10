(*---
description: Evaluates a random seq expression, seed 262, number 8875.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08875 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(<<((LET b13746 == 2147483647 IN b13746 \div Len(<<3, 1, 2>>)) % IF (-1 => TRUE) THEN IF FALSE THEN -1 ELSE 0 ELSE (1 % 0)), ((Head(<<1>>) % ([a |-> 1, b |-> TRUE]).a) - ((2147483647 - 2) % Cardinality({1})))>>)
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08875 failed.
    Attempted to evaluate an expression of form P => Q when P was
    an integer.
    line 14, col 84 to line 14, col 93 of module random_08875
---*)

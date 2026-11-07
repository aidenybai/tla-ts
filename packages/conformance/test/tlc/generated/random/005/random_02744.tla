(*---
description: Evaluates a random record expression, seed 262, number 2744.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02744 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[(CHOOSE r \in [a : 2..1] : TRUE) EXCEPT !.a = @ + Cardinality((7 .. 0))] EXCEPT !.a = LET b4331 == (LET b4332 == 7 IN 2147483647 \div ([a |-> 1, b |-> TRUE]).a) IN (Head(<<3, 1, 2>>) + [[a |-> 1, b |-> TRUE] EXCEPT !.a = b4331])])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02744 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 19 to line 14, col 48 of module random_02744
---*)

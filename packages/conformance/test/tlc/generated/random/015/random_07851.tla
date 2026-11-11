(*---
description: Evaluates a random record expression, seed 262, number 7851.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07851 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[[[[a |-> 1] EXCEPT !.a = @ + 3] EXCEPT !.a = (3 % 7)] EXCEPT !.a = @ + ([b12131 \in {} |-> b12131])[LET b12132 == 2147483647 IN 3]] EXCEPT !.a = @ + IF ((7 * <<1, 2>>) < (2 % 3)) THEN ((7 + 2) % (3 - 7)) ELSE ([-1 EXCEPT ![7] = 1])[IF FALSE THEN <<>> ELSE 1]])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07851 failed.
    In applying the function
    <<>>,
    the first argument is:
    3
    which is not in its domain.
---*)

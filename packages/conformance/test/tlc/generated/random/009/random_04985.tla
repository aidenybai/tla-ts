(*---
description: Evaluates a random int expression, seed 262, number 4985.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04985 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[[a |-> (2 \div 3), b |-> (TRUE => TRUE)] EXCEPT !.a = @ + (Cardinality({2, 1, 3}) % ([x \in 1..2 |-> x])[-1])] EXCEPT !.a = LET b7760 == ((3 * 1) + LET b7761 == 2147483647 IN b7761) IN LET b7762 == (b7760 - 0) IN Head(<<1, 2>>)])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04985 failed.
    In applying the function
    <<1, 2>>,
    the first argument is:
    -1
    which is not in its domain.
---*)

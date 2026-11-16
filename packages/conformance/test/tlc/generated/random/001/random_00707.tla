(*---
description: Evaluates a random record expression, seed 262, number 707.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00707 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[[({2, 1, 3} => FALSE) EXCEPT !.a = Len(<<1>>)] EXCEPT !.a = (Cardinality(Nat) \div IF FALSE THEN 7 ELSE 1)] EXCEPT !.a = @ + ((([a |-> 1]).a % Head(<<3, 1, 2>>)) \div Len(([a |-> 1] \o <<1, 2>>)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00707 failed.
    Attempted to evaluate an expression of form P => Q when P was
    a set of the form {e1, ... ,eN}.
    line 14, col 20 to line 14, col 37 of module random_00707
---*)

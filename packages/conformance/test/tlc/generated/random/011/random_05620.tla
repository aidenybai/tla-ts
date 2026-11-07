(*---
description: Evaluates a random record expression, seed 262, number 5620.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05620 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[a |-> Tail(Append(<<1>>, 3)), b |-> ([[a |-> 1, b |-> TRUE] EXCEPT !.a = @ + 7] = [[a |-> 1] EXCEPT !.a = @ + 7])] EXCEPT !.a = @ + (LET b8692 == Len(<<1, 2>>) IN Cardinality({}) - IF (TRUE => {2, 1, 3}) THEN LET b8693 == -1 IN 2147483647 ELSE (2147483647 + 7))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05620 failed.
    Attempted to evaluate an expression of form P => Q when Q was
    a set of the form {e1, ... ,eN}.
    line 14, col 203 to line 14, col 219 of module random_05620
---*)

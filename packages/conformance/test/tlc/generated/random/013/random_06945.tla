(*---
description: Evaluates a random int expression, seed 262, number 6945.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06945 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([((2 % 3) :> Head(<<1, 2>>)) EXCEPT ![(Len(<<3, 1, 2>>) % (2 * 0))] = Len(Append(<<1, 2>>, 3))])[LET b10629 == (Len(<<1, 2>>) \div (3 \div 1)) IN [[[a |-> 1, b |-> TRUE] EXCEPT !.a = b10629] EXCEPT !.a = @ + (2 - [a |-> 1, b |-> TRUE])]])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2169:0 The second argument of % should be a positive number, but instead it is:
    0
    2169:0 The second argument of % should be a positive number, but instead it is:
    0
---*)

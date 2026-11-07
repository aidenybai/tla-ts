(*---
description: Evaluates a random function expression, seed 262, number 8029.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08029 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((Len((<<3, 1, 2>> \o <<>>)) \div (Head(<<1, 2>>) % (0 - -1))) :> (Len(<<1, 2147483647>>) - [[[a |-> 1] EXCEPT !.a = @ + 2147483647] EXCEPT !.a = @ + Cardinality({2, 1, 3})])))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2179:0 The second argument of \div is 0.
    2179:0 The second argument of \div is 0.
---*)

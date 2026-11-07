(*---
description: Evaluates a random seq expression, seed 262, number 8581.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08581 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([SelectSeq([SelectSeq(<<3, 1, 2>>, LAMBDA e : e > 0) EXCEPT ![1] = [[a |-> 1] EXCEPT !.a = @ + -1]], LAMBDA e : e > 0) EXCEPT ![1] = (SelectSeq([<<>> EXCEPT ![1] = 3], LAMBDA e : e > 0) \div (IF TRUE THEN 3 ELSE 1 % IF FALSE THEN 2147483647 ELSE 7))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2266:0 The first argument of > should be an integer, but instead it is:
    [a |-> 0]
    2266:0 The first argument of > should be an integer, but instead it is:
    [a |-> 0]
---*)

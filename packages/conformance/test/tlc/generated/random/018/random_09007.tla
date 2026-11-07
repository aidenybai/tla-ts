(*---
description: Evaluates a random bool expression, seed 262, number 9007.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09007 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((LET b13988 == (Head(<<1>>) % ([a |-> 1, b |-> TRUE]).a) IN LET b13989 == (\E b13990 \in {1, 2} : 2) IN Head(b13988) \in {b13991 \in SelectSeq((<<3, 1, 2>> \o <<1, 2>>), LAMBDA e : e > 0) : (({2, 1, 3} \cap 2..1) = {b13991, 0})}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2283:0 The argument of Head should be a sequence, but instead it is:
    0
    2283:0 The argument of Head should be a sequence, but instead it is:
    0
---*)

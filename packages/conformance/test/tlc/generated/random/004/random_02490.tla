(*---
description: Evaluates a random seq expression, seed 262, number 2490.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02490 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Tail(Append([Append(<<1, 2>>, -1) EXCEPT ![1] = {b3920 \in {1} : FALSE}], ((1 \div 0) - ([a |-> 1]).a))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2179:0 The second argument of \div is 0.
    2179:0 The second argument of \div is 0.
---*)

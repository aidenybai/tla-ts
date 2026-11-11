(*---
description: Evaluates a random function expression, seed 262, number 3477.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03477 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Len(Append((<<1>> \o <<>>), ([a |-> 1]).a)) :> (-(Head(<<1, 2>>) + (7 \div 3)))))
====

(*--- recorded
all:
  exit: 0
  transcript: "| (2 :> -3)"
---*)

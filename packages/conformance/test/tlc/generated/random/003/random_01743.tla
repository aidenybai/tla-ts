(*---
description: Evaluates a random int expression, seed 262, number 1743.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01743 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(LET b2768 == Len(SubSeq(Tail(<<>>), (-0), CASE TRUE -> 2147483647 [] OTHER -> 1)) IN Len([Append(<<1, 2>>, 1) EXCEPT ![1] = Len(<<1>>)]))
====

(*--- recorded
all:
  exit: 0
  transcript: "| 3"
---*)

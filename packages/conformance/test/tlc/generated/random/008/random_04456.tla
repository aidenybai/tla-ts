(*---
description: Evaluates a random seq expression, seed 262, number 4456.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04456 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([[<<2147483647, -1>> EXCEPT ![1] = (2 % 1)] EXCEPT ![1] = Len(SubSeq(<<3, 1, 2>>, 2, 0))] \o SelectSeq(Tail(Append(<<>>, 7)), LAMBDA e : e > 0)))
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<0, -1>>"
---*)

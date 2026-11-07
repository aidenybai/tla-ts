(*---
description: Evaluates a random seq expression, seed 262, number 8045.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08045 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Append([(<<2147483647, 2147483647>> \o SubSeq(<<>>, 7, 3)) EXCEPT ![1] = ((3 - -1) \div (2 * 7))], Head((SelectSeq(<<3, 1, 2>>, LAMBDA e : e > 0) \o (<<>> \o <<1>>)))))
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<0, 2147483647, 3>>"
---*)

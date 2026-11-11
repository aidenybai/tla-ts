(*---
description: Evaluates a random seq expression, seed 262, number 4440.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04440 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([SelectSeq(SelectSeq(Append(<<1, 2>>, 2), LAMBDA e : e > 0), LAMBDA e : e > 0) EXCEPT ![1] = Append(SelectSeq([<<3, 1, 2>> EXCEPT ![1] = 0], LAMBDA e : e > 0), ((2 \div 1) \div IF FALSE THEN 7 ELSE 7))])
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<<<1, 2, 0>>, 2, 2>>"
---*)

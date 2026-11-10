(*---
description: Evaluates a random seq expression, seed 262, number 4876.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04876 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SelectSeq([Tail((<<1, 2>> \o <<1, 2>>)) EXCEPT ![1] = CASE ([a |-> 1] = [a |-> 1]) -> Head(<<1>>) [] OTHER -> (1 % 7)], LAMBDA e : e > 0))
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<1, 1, 2>>"
---*)

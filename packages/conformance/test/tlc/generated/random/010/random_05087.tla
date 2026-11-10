(*---
description: Evaluates a random seq expression, seed 262, number 5087.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05087 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Tail(Append([<<1, 2>> EXCEPT ![1] = 7], (-1))) \o (SubSeq(<<2147483647, 2147483647>>, CASE TRUE -> 2 [] OTHER -> 2, ([a |-> 1]).a) \o Append([<<1>> EXCEPT ![1] = 7], Head(<<1, 2>>)))))
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<2, -1, 7, 1>>"
---*)

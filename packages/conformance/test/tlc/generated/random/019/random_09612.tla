(*---
description: Evaluates a random int expression, seed 262, number 9612.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09612 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(LET b14926 == ((CHOOSE r \in [a : {0} \cup {1}] : TRUE)).a IN Head(Append(SelectSeq(<<1, 2>>, LAMBDA e : e > 0), ([x \in Nat |-> x + 1])[3])))
====

(*--- recorded
all:
  exit: 0
  transcript: "| 1"
---*)

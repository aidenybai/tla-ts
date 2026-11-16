(*---
description: Evaluates a random set expression, seed 262, number 4313.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04313 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({[SelectSeq(SubSeq(<<>>, [a |-> 1], 0), LAMBDA e : e > 0) EXCEPT ![1] = Len([<<1, 2>> EXCEPT ![1] = -1])] : b6797 \in {b6798 \in {b6799 \in UNION {1..3, 2..1} : (TRUE <=> FALSE)} : (~(<<1, 2>> = b6798))}})
====

(*--- recorded
all:
  exit: 0
  transcript: "| {}"
---*)

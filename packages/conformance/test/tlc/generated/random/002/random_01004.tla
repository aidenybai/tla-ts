(*---
description: Evaluates a random record expression, seed 262, number 1004.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01004 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a |-> SelectSeq((Tail(<<>>) \o Tail(<<>>)), LAMBDA e : e > 0), b |-> ({(-2147483647) : b1613 \in {b1614 \in <<3, 1, 2>> : FALSE}} \subseteq (DOMAIN [x \in 1..2 |-> x] \cup DOMAIN <<5, 6>>))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2184:0 Attempted to apply Tail to the empty sequence.
    2184:0 Attempted to apply Tail to the empty sequence.
---*)

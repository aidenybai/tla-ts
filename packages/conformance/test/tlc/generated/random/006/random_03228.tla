(*---
description: Evaluates a random bool expression, seed 262, number 3228.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03228 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((({7, -1} \subseteq DOMAIN (1 :> 2)) \/ ((TRUE /\ FALSE) /\ (1..3 \subseteq {x \in 1..3 : x > 1}))) /\ SortSeq(SubSeq(SortSeq(<<>>, LAMBDA p, q : p < q), ([a |-> 1, b |-> TRUE]).a, Len(<<1, 2>>)), LAMBDA p, q : p < q)))
====

(*--- recorded
all:
  exit: 0
  transcript: "| FALSE"
---*)

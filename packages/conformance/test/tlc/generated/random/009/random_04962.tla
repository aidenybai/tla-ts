(*---
description: Evaluates a random bool expression, seed 262, number 4962.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04962 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Append(Tail(SubSeq(<<3, 1, 2>>, 3, 0)), IF (Nat \subseteq {}) THEN Cardinality(1) ELSE (CHOOSE b7723 \in 2..1 : FALSE)) = (({[a |-> 1] : b7724 \in 1..3} \cup DOMAIN (1 :> 2)) \cup {(b7725 \div 0) : b7725 \in {b7726 \in {2, 1, 3} : {1, 2}}})))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2184:0 Attempted to apply Tail to the empty sequence.
    2184:0 Attempted to apply Tail to the empty sequence.
---*)

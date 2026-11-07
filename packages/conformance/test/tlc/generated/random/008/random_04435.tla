(*---
description: Evaluates a random bool expression, seed 262, number 4435.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04435 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Head([<<-1, 1>> EXCEPT ![1] = (1 + 7)]) \in {(Len(<<>>) + Head(<<>>)) : b6981 \in {(2 \div 0), Head(<<3, 1, 2>>)}}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2179:0 The second argument of \div is 0.
    2179:0 The second argument of \div is 0.
---*)

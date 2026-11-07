(*---
description: Evaluates a random bool expression, seed 262, number 4747.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04747 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((\E b7410 \in UNION {(1 .. -1), DOMAIN <<5, 6>>} : (([a |-> 1]).a = Len(<<1, 2>>))) \/ (((\E b7411 \in {1, 2} : TRUE) /\ (FALSE \/ FALSE)) /\ (\E b7412 \in ({x \in 1..3 : x > 1} \cup {1}) : ((1 :> 2) \in {1, 2})))))
====

(*--- recorded
all:
  exit: 0
  transcript: "| FALSE"
---*)

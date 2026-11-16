(*---
description: Evaluates a random bool expression, seed 262, number 3038.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03038 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((~(TRUE <=> TRUE)) => ((3 \in TRUE) \/ (TRUE /\ 1))) <=> ((SubSeq(<<>>, 1, -1) = (0 :> -1)) <=> ((1 < 3) /\ ({x \in 1..3 : x > 1} = {1})))))
====

(*--- recorded
all:
  exit: 0
  transcript: "| TRUE"
---*)

(*---
description: Evaluates a random int expression, seed 262, number 1434.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01434 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Len(SubSeq(SubSeq(TRUE, [x \in Nat |-> x + 1], 1), IF FALSE THEN 2147483647 ELSE 2, Append(<<1>>, 7))) \div LET b2295 == CASE (2..1 \subseteq 1..3) -> (-1 % 1) [] OTHER -> Cardinality({x \in 1..3 : x > 1}) IN (CHOOSE b2296 \in (1..3 \ {1}) : (~TRUE))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2169:0 The first argument of SubSeq should be a sequence, but instead it is:
    TRUE
    2169:0 The first argument of SubSeq should be a sequence, but instead it is:
    TRUE
---*)

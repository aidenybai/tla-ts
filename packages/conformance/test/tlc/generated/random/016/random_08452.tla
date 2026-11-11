(*---
description: Evaluates a random bool expression, seed 262, number 8452.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08452 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((CASE ((1 = 2) \/ ([a |-> 1, b |-> TRUE] = [a |-> 1, b |-> TRUE])) -> Len([<<3, 1, 2>> EXCEPT ![1] = 2147483647]) [] OTHER -> CASE (TRUE \/ TRUE) -> Len(<<>>) [] OTHER -> ([a |-> 1]).a .. Cardinality(((SUBSET {1} \ 1..3) \cup (7 .. -1)))))
====

(*--- recorded
all:
  exit: 0
  transcript: "| 3"
---*)

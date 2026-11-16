(*---
description: Evaluates a random bool expression, seed 262, number 2467.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02467 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((CASE (~TRUE) -> (1 - SUBSET {1}) [] OTHER -> Cardinality(SUBSET {1}) = IF (FALSE \/ TRUE) THEN Len(<<3, 1, 2>>) ELSE IF FALSE THEN 2 ELSE 1) /\ (Len(SubSeq(<<>>, 7, 3)) = SortSeq((<<1, 2>> \o <<3, 1, 2>>), LAMBDA p, q : p < q))))
====

(*--- recorded
all:
  exit: 0
  transcript: "| FALSE"
---*)

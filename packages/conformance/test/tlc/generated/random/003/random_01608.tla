(*---
description: Evaluates a random seq expression, seed 262, number 1608.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01608 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(<<(((CHOOSE r \in [a : {2, 1, 3}] : TRUE)).a + (Len(<<1>>) + (7 % 2147483647))), IF (({1, 2} \subseteq 2..1) /\ SortSeq(<<1>>, LAMBDA p, q : p < q)) THEN Len(SubSeq(<<1>>, 2, 2)) ELSE (CHOOSE b2566 \in ({1} \cup {1}) : (\E b2567 \in 1..3 : TRUE))>>)
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<9, 1>>"
---*)

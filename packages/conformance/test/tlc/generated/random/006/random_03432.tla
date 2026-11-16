(*---
description: Evaluates a random bool expression, seed 262, number 3432.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03432 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Append(SelectSeq(Tail(<<3, 1, 2>>), LAMBDA e : e > 0), (CASE TRUE -> 7 [] OTHER -> 3 % (2147483647 + 2))) = (((CHOOSE f \in [{0} \cup {1} -> {1, 2} \cap {2}] : TRUE))[Len(<<1>>)] :> (IF FALSE THEN 2147483647 ELSE -1 + (1 + 3)))))
====

(*--- recorded
all:
  exit: 0
  transcript: "| FALSE"
---*)

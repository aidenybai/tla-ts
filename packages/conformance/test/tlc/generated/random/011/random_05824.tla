(*---
description: Evaluates a random seq expression, seed 262, number 5824.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05824 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SelectSeq(SubSeq(<<CASE FALSE -> 3 [] OTHER -> 0, (2147483647 :> 0)>>, Cardinality({b8980 \in {1, 2} : FALSE}), (IF TRUE THEN -1 ELSE -1 \div LET b8981 == -1 IN FALSE)), LAMBDA e : e > 0))
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<>>"
---*)

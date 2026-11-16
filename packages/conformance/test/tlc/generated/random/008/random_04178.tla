(*---
description: Evaluates a random record expression, seed 262, number 4178.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04178 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([(CHOOSE r \in [a : {2, 1, 3}] : TRUE) EXCEPT !.a = IF (({2, 1, 3} \cap {2, 1, 3}) = ({1} \ 1..3)) THEN LET b6569 == (1 + 1) IN Len(<<3, 1, 2>>) ELSE Len(SelectSeq(<<>>, LAMBDA e : e > 0))])
====

(*--- recorded
all:
  exit: 0
  transcript: "| [a |-> 0]"
---*)

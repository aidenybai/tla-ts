(*---
description: Evaluates a random int expression, seed 262, number 8374.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08374 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(IF ((\E b12954 \in ({1, 2} \cap Nat) : (FALSE /\ FALSE)) \/ (~(FALSE /\ TRUE))) THEN (-Head([<<1, 2>> EXCEPT ![1] = 2147483647])) ELSE Head(SubSeq([b12955 \in {1} |-> 0], LET b12956 == 3 IN b12956, Len(7))))
====

(*--- recorded
all:
  exit: 0
  transcript: "| -2147483647"
---*)

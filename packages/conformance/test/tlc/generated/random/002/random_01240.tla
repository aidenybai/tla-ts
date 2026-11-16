(*---
description: Evaluates a random bool expression, seed 262, number 1240.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01240 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((((7 .. -1) \ ({1} \ {1, 2})) \subseteq {b1988 \in {0 : b1989 \in 2..1} : (TRUE => TRUE)}) => (((<<1>> = <<5, 6>>) /\ (TRUE \/ FALSE)) /\ ([b1990 \in 1..3 |-> b1990] < (-1 - 1)))))
====

(*--- recorded
all:
  exit: 0
  transcript: "| FALSE"
---*)

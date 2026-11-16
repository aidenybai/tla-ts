(*---
description: Evaluates a random bool expression, seed 262, number 1037.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01037 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((\E b1661 \in {CASE (TRUE /\ FALSE) -> LET b1663 == 0 IN 3 [] OTHER -> (3 + 1) : b1662 \in {b1664 \in {0, 3} : (2 = b1664)}} : (((3 = b1661) /\ (FALSE \/ TRUE)) /\ (IF FALSE THEN 3 ELSE b1661 \in {b1665 \in {1} : 3}))))
====

(*--- recorded
all:
  exit: 0
  transcript: "| FALSE"
---*)

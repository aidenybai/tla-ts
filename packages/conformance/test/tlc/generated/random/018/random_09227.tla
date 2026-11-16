(*---
description: Evaluates a random bool expression, seed 262, number 9227.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09227 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((\A b14321 \in {(LET b14323 == b14322 IN b14322 - (-1 + 3)) : b14322 \in ((CHOOSE f \in [{1} -> 1..2] : TRUE) \cap ({1} \ Nat))} : ((Head(<<1, 2>>) \div (-b14321)) = IF (0 = b14321) THEN Head(<<1>>) ELSE ([x \in Nat |-> x + 1])[0])))
====

(*--- recorded
all:
  exit: 0
  transcript: "| TRUE"
---*)

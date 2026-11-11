(*---
description: Evaluates a random seq expression, seed 262, number 962.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00962 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Append(<<LET b1555 == Head(<<1, 2>>) IN (b1555 \div 1), ((7 * 1) + (1 + 3))>>, LET b1556 == IF (~TRUE) THEN (-2) ELSE ((1 :> 2))[-1] IN LET b1557 == (-0) IN (<<5, 6>>)[2]))
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<1, 11, 6>>"
---*)

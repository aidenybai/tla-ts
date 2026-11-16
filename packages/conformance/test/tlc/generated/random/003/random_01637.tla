(*---
description: Evaluates a random bool expression, seed 262, number 1637.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01637 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((\A b2616 \in {b2617 \in ({7, 0} \ (Nat \ {})) : ((-1 \div 0) \in {b2618 \in 2..1 : <<3, 1, 2>>})} : (<<LET b2619 == b2616 IN b2616, (b2616 - b2616)>> = [b2620 \in DOMAIN [x \in 1..2 |-> x] |-> ([a |-> 1]).a])))
====

(*--- recorded
all:
  exit: 0
  transcript: "| TRUE"
---*)

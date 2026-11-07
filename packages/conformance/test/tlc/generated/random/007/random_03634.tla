(*---
description: Evaluates a random bool expression, seed 262, number 3634.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03634 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((({Head(<<1>>) : b5740 \in {b5741 \in {} : TRUE}} = (UNION {{}, {2, 1, 3}} \cup {-1, 2147483647})) => ((CHOOSE r \in [a : {2, 1, 3}] : TRUE) = (CHOOSE r \in [a : {1, 2}] : TRUE))))
====

(*--- recorded
all:
  exit: 0
  transcript: "| TRUE"
---*)

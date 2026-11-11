(*---
description: Evaluates a random bool expression, seed 262, number 9389.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09389 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((~(((-1 * 3) = IF FALSE THEN 7 ELSE 0) \/ (\A b14568 \in DOMAIN <<5, 6>> : ({2, 1, 3} = SUBSET {1})))))
====

(*--- recorded
all:
  exit: 0
  transcript: "| TRUE"
---*)

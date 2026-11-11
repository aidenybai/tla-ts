(*---
description: Evaluates a random bool expression, seed 262, number 1437.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01437 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Cardinality(((2147483647 .. -1) \cup ({2, 1, 3} \ {1, 2}))) \in UNION {{Len(<<>>), Len(<<>>)}, DOMAIN (<<5, 6>> @@ <<5, 6>>)}))
====

(*--- recorded
all:
  exit: 0
  transcript: "| TRUE"
---*)

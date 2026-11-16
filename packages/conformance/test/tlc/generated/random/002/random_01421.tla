(*---
description: Evaluates a random set expression, seed 262, number 1421.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01421 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((DOMAIN ([<<1>> EXCEPT ![1] = 3] @@ (CHOOSE f \in [{1, 2} \ {1} -> 1..2] : TRUE)) \cup UNION {{Len(<<3, 1, 2>>) : b2268 \in (7 .. 0)}, ((3 .. -1) \ (Nat \cup 1..3))}))
====

(*--- recorded
all:
  exit: 0
  transcript: "| {1, 2}"
---*)

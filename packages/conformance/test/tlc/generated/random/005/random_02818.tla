(*---
description: Evaluates a random bool expression, seed 262, number 2818.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02818 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((UNION {{b4478 \in ({1} \ Nat) : (~TRUE)}, UNION {{3 : b4479 \in {}}, {b4480 \in 2..1 : TRUE}}} \subseteq UNION {((TRUE \cap SUBSET {1}) \cup (Nat \ {2, 1, 3})), {b4481 \in Head(<<1>>) : SubSeq(<<>>, Nat, 1)}}))
====

(*--- recorded
all:
  exit: 0
  transcript: "| TRUE"
---*)

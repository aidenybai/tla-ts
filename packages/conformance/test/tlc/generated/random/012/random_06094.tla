(*---
description: Evaluates a random bool expression, seed 262, number 6094.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06094 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((({b9378 \in ({2, 1, 3} \ Nat) : (2147483647 \in 1..3)} \ {(1 - 0), (-3)}) \subseteq {b9379 \in (({} \ Nat) \ (2147483647 .. 7)) : ((CHOOSE r \in [a : 2..1] : TRUE)).a}))
====

(*--- recorded
all:
  exit: 0
  transcript: "| TRUE"
---*)

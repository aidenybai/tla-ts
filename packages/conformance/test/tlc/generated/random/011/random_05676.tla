(*---
description: Evaluates a random bool expression, seed 262, number 5676.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05676 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((SelectSeq([SelectSeq(Nat, LAMBDA e : e > 0) EXCEPT ![1] = (7 - 0)], LAMBDA e : e > 0) = [b8751 \in (DOMAIN (1 :> 2) \cap ({1} \cup [a |-> 1, b |-> TRUE])) |-> IF (7 \in Nat) THEN LET b8752 == b8751 IN 2147483647 ELSE CASE TRUE -> b8751 [] OTHER -> 2]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2169:0 The first argument of SelectSeq should be a sequence, but instead it is:
    Nat
    2169:0 The first argument of SelectSeq should be a sequence, but instead it is:
    Nat
---*)

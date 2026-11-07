(*---
description: Evaluates a random bool expression, seed 262, number 5976.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05976 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((~(\A b9209 \in (Nat \cup {1, 2}) : (\A b9210 \in SUBSET {1} : FALSE))) /\ ([a |-> (0 % 7), b |-> ({2, 1, 3} = {1, 2})] = (CHOOSE r \in [a : {2, 1, 3}] : TRUE))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05976 failed.
    Attempted to enumerate S \cup T when S:
    {1, 2}
    and T:
    Nat
    are not both enumerable
---*)

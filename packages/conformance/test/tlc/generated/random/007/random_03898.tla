(*---
description: Evaluates a random set expression, seed 262, number 3898.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03898 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((DOMAIN [b6134 \in DOMAIN <<3, 1, 2>> |-> (b6134 + b6134)] \cap DOMAIN [[(1 :> 2) EXCEPT ![0] = 0] EXCEPT ![IF FALSE THEN {1} ELSE 1] = LET b6135 == 2 IN 1]))
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 90 to line 14, col 95 of module random_03898
    | {1}
---*)

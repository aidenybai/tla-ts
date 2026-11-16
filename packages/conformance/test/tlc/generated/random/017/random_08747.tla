(*---
description: Evaluates a random int expression, seed 262, number 8747.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08747 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((CHOOSE b13540 \in ((<<5, 6>> \cap {1, 2}) \cup DOMAIN (1 :> 2)) : ((1 - b13540) :> (2 % 2147483647))) % (((-2147483647) \div IF FALSE THEN TRUE ELSE 2147483647) % (CHOOSE b13541 \in (Nat \cup 1..3) : (<<3, 1, 2>> = [x \in Nat |-> x + 1])))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08747 failed.
    Attempted to check set membership in a tuple value.
---*)

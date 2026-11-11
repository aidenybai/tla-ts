(*---
description: Evaluates a random bool expression, seed 262, number 9728.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09728 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((\E b15097 \in (((3 * 1) .. CASE TRUE -> 1 [] OTHER -> 0) \cup ({2147483647, 7} \ {0, 1})) : (({b15098 : b15098 \in {1}} \subseteq (-1 .. b15097)) /\ (CHOOSE r \in [a : {1}] : TRUE))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09728 failed.
    Attempted to evaluate an expression of form P /\ Q when Q was
    a record.
    line 14, col 110 to line 14, col 196 of module random_09728
---*)

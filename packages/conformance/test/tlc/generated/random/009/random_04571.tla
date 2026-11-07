(*---
description: Evaluates a random set expression, seed 262, number 4571.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04571 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((({LET b7172 == 1..3 IN b7172 : b7171 \in ({1} \cup Nat)} \ (CHOOSE r \in [a : {1, 2} \cap {2}] : TRUE)) \cap DOMAIN [b7173 \in {b7174 \in {x \in 1..3 : x > 1} : TRUE} |-> Len(<<1, 2>>)]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04571 failed.
    Attempted to enumerate S \cup T when S:
    {1}
    and T:
    Nat
    are not both enumerable
---*)

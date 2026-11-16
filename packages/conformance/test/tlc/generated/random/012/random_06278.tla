(*---
description: Evaluates a random bool expression, seed 262, number 6278.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06278 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((\E b9658 \in DOMAIN (TRUE <=> 2) : ([a |-> 1, b |-> TRUE] \/ (\A b9659 \in SUBSET {1} : TRUE))) /\ ((CASE <<1, 2>> -> 2 [] OTHER -> 0 + LET b9660 == 7 IN 2) \in {b9661 \in (Nat \cup {1}) : (\E b9662 \in 2..1 : TRUE)})))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06278 failed.
    Attempted to evaluate an expression of form P <=> Q when P or Q was not a boolean.
    line 14, col 39 to line 14, col 48 of module random_06278
---*)

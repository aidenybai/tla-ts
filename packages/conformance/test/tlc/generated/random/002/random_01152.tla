(*---
description: Evaluates a random bool expression, seed 262, number 1152.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01152 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((({(-7) : b1846 \in UNION {1..3, {1}}} \cap (DOMAIN <<5, 6>> \cap (Nat \ TRUE))) \subseteq {b1847 \in {b1848 \in {b1849 \in Nat : TRUE} : Len(2..1)} : (({x \in 1..3 : x > 1} \subseteq 1..3) <=> (<<>> = [x \in 1..2 |-> x]))}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01152 failed.
    Attempted to check if the value:
    1
    is an element of the boolean TRUE
---*)

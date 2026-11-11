(*---
description: Evaluates a random bool expression, seed 262, number 24.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00024 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((({(1 \div 7) : b32 \in DOMAIN <<5, 6>>} \subseteq (([x \in 1..2 |-> x])[-1] - CASE TRUE -> 3 [] OTHER -> <<>>)) /\ (Tail((<<3, 1, 2>> \o <<3, 1, 2>>)) = [b33 \in UNION {2..1, Nat} |-> (b33 * b33)])))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00024 failed.
    In applying the function
    <<1, 2>>,
    the first argument is:
    -1
    which is not in its domain.
---*)

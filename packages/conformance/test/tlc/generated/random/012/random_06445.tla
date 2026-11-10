(*---
description: Evaluates a random function expression, seed 262, number 6445.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06445 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Head((Tail(<<1, 2>>) \o <<2147483647, -1>>)) :> (CHOOSE b9920 \in (UNION {{2, 1, 3}, Nat} \cup {b9921 \in {x \in 1..3 : x > 1} : TRUE}) : ((7 .. 1) \ ({} \ 2..1)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06445 failed.
    Attempted to compare overridden value Nat with non-overridden value:
    {1, 2, 3}
---*)

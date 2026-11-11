(*---
description: Evaluates a random set expression, seed 262, number 2156.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02156 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((DOMAIN (CHOOSE f \in [{} -> {1}] : TRUE) \cup ({Head(<<>>) : b3406 \in (2 .. 1)} \cap {CASE FALSE -> 1..3 [] OTHER -> <<5, 6>> : b3407 \in {0 : b3408 \in <<3, 1, 2>>}})))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02156 failed.
    TLC encountered a non-enumerable quantifier bound
    <<3, 1, 2>>.
    line 14, col 171 to line 14, col 181 of module random_02156
---*)

(*---
description: Evaluates a random bool expression, seed 262, number 6767.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06767 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((\A b10375 \in UNION {({-1 : b10376 \in TRUE} \cup {0, 2147483647}), UNION {(0 .. 1), (<<>> \cup {})}} : ((({} \ {x \in 1..3 : x > 1}) \cap DOMAIN [x \in Nat |-> x + 1]) = (({2, 1, 3} \cup Nat) \cup ({1} \cup 2..1)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06767 failed.
    TLC encountered a non-enumerable quantifier bound
    TRUE.
    line 14, col 56 to line 14, col 59 of module random_06767
---*)

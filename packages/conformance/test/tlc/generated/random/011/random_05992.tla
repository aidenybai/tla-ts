(*---
description: Evaluates a random set expression, seed 262, number 5992.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05992 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((({b9235 \in ({1} \cup {}) : (~FALSE)} \ {(2147483647 + b9236) : b9236 \in {2147483647, <<5, 6>>}}) \cup (UNION {{b9237 : b9237 \in 2..1}, {b9238 : b9238 \in 2..1}} \cup (DOMAIN (1 :> 2) \cup ([a |-> 1] = [a |-> 1, b |-> TRUE])))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05992 failed.
    Attempted to compare the function <<5, 6>> with the value:
    2147483647
---*)

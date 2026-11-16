(*---
description: Evaluates a random set expression, seed 262, number 2586.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02586 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((UNION {{b4074 \in {1, 2} : FALSE}, ({x \in 1..3 : x > 1} \ {1})} \cup {((1 :> 2))[b4075] : b4075 \in ({2, 1, 3} \ {x \in 1..3 : x > 1})}) \cup ({(2 - 1), (0).a} \ ((1..3 \cup Nat) \ {b4076 \in {1, 2} : FALSE}))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02586 failed.
    Attempted to select field "a" from a non-record value 0
    line 14, col 172 to line 14, col 176 of module random_02586
---*)

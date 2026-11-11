(*---
description: Evaluates a random set expression, seed 262, number 4074.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04074 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((({2147483647, -1} \cap (Nat \cap 1..3)) \cup DOMAIN (CHOOSE f \in [{2, 1, 3} -> 2..1] : TRUE)) \cap {b6409 \in (({} \cup {}) \cup ({x \in 1..3 : x > 1} \cup {x \in 1..3 : x > 1})) : ((\E b6410 \in {2, 1, 3} : FALSE) \/ ({x \in 1..3 : x > 1} \subseteq 2..1))}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04074 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 71 to line 14, col 109 of module random_04074
---*)

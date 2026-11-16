(*---
description: Evaluates a random set expression, seed 262, number 9514.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09514 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({b14775 \in ((CHOOSE f \in [{1} -> {}] : TRUE))[([a |-> 1, b |-> TRUE]).a] : ({b14776 \in Nat : TRUE} \subseteq {b14777 \in Nat : TRUE})} \cap ({(7 - 1) : b14778 \in ({} \cup {1, 2})} \cup UNION {{2147483647, 3}, {-1, 1}})))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09514 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 31 to line 14, col 61 of module random_09514
---*)

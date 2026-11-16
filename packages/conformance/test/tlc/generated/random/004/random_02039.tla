(*---
description: Evaluates a random bool expression, seed 262, number 2039.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02039 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((DOMAIN (CHOOSE f \in [{1, 2} -> {1, 2} \cap {2}] : TRUE) = {b3238 \in UNION {UNION {{}, {2, 1, 3}}, (Nat \ {x \in 1..3 : x > 1})} : (\A b3239 \in (Nat \cap {}) : (TRUE <=> FALSE))}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02039 failed.
    Attempted to enumerate S \ T when S:
    Nat
    is not enumerable.
---*)

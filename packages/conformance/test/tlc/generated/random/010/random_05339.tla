(*---
description: Evaluates a random int expression, seed 262, number 5339.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05339 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((\A b8254 \in DOMAIN (({1, 2} \cap {}) = {b8255 \in 1..3 : TRUE}) : ((CHOOSE f \in [1..2 -> {1, 2} \ {1}] : TRUE) => ((2..1 = {}) \/ (b8254 < b8254)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05339 failed.
    Attempted to apply the operator DOMAIN to a non-function
    (a Boolean value)
    line 14, col 30 to line 14, col 80 of module random_05339
---*)

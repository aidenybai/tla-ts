(*---
description: Evaluates a random bool expression, seed 262, number 6025.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06025 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({b9279 \in {LET b9280 == 7 IN b9280, Len(<<1>>)} : (\A b9281 \in {-1, 1..3} : ({1, 2} \subseteq 2..1))} = {b9282 \in DOMAIN [b9283 \in {x \in 1..3 : x > 1} |-> 1..3] : ((TRUE <=> TRUE) \/ (\E b9284 \in FALSE : FALSE))}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06025 failed.
    Attempted to compare the set {1, 2, 3} with the value:
    -1
---*)

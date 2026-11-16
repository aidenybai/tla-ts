(*---
description: Evaluates a random set expression, seed 262, number 6553.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06553 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({(CHOOSE b10072 \in {b10073 \in (0 .. 2147483647) : (<<1, 2>> = FALSE)} : ((Nat \cap 2..1) \subseteq {b10072, b10072})), (CHOOSE b10074 \in DOMAIN (2147483647 :> -1) : (({x \in 1..3 : x > 1} \cup 2..1) \subseteq ([x \in 1..2 |-> x] \cup {1, 2})))})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06553 failed.
    Attempted to check equality of the function <<1, 2>> with the value:
    FALSE
---*)

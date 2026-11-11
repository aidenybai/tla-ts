(*---
description: Evaluates a random seq expression, seed 262, number 1209.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01209 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[[a |-> (TRUE).a, b |-> (\E b1947 \in Nat : TRUE)] EXCEPT !.a = @ + IF (Nat \subseteq {1, 2}) THEN (2 * 7) ELSE (0 * 1)] EXCEPT !.a = @ + LET b1948 == ([[x \in 1..2 |-> x] EXCEPT ![7] = 0])[(1 - 0)] IN ((2..1 = {x \in 1..3 : x > 1}) /\ (TRUE \/ FALSE))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01209 failed.
    Attempted to select field "a" from a non-record value TRUE
    line 14, col 25 to line 14, col 32 of module random_01209
---*)

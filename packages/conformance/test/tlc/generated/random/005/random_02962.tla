(*---
description: Evaluates a random bool expression, seed 262, number 2962.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02962 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((\E b4696 \in DOMAIN [b4697 \in UNION {{x \in 1..3 : x > 1}, {1}} |-> (b4697 % 7)] : (((\E b4698 \in <<1>> : TRUE) /\ (\E b4699 \in {1, 2} : TRUE)) /\ (\A b4700 \in {7 : b4701 \in 1..3} : (Nat \subseteq {1, 2})))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02962 failed.
    TLC encountered a non-enumerable quantifier bound
    <<1>>.
    line 14, col 117 to line 14, col 121 of module random_02962
---*)

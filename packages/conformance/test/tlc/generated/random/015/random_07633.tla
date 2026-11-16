(*---
description: Evaluates a random int expression, seed 262, number 7633.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07633 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(IF (\E b11739 \in (~(\A b11740 \in 1..3 : FALSE)) : (~({x \in 1..3 : x > 1} = b11739))) THEN CASE (({1} \ Nat) = {b11741 \in Nat : FALSE}) -> Len(Tail(<<>>)) [] OTHER -> ((0 + FALSE) + ([a |-> 1] + 7)) ELSE (CHOOSE b11742 \in UNION {({2, 1, 3} \cap {}), (SUBSET {1} \ [a |-> 1])} : (\E b11743 \in {0 : b11744 \in SUBSET {1}} : (b11743 /\ (1 :> 2)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07633 failed.
    TLC encountered a non-enumerable quantifier bound
    TRUE.
    line 14, col 35 to line 14, col 63 of module random_07633
---*)

(*---
description: Evaluates a random bool expression, seed 262, number 5846.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05846 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((CASE (\E b9013 \in {2147483647 : b9014 \in {1, 2}} : {b9015 \in {} : TRUE}) -> IF (-1 < -1) THEN (7 % 1) ELSE Cardinality(2..1) [] OTHER -> CASE ([a |-> 1] = [a |-> 1]) -> LET b9016 == -1 IN b9016 [] OTHER -> (CHOOSE b9017 \in {x \in 1..3 : x > 1} : FALSE) = (((CHOOSE b9018 \in Nat : FALSE) + LET b9019 == 2147483647 IN b9019) \div (({1} \cup {2, 1, 3}) % Cardinality({2, 1, 3})))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05846 failed.
    2215:0 TLC expected a boolean value, but did not find one. line 14, col 23 to line 14, col 90 of module random_05846
---*)

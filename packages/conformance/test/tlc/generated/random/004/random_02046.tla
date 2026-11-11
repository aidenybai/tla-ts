(*---
description: Evaluates a random bool expression, seed 262, number 2046.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02046 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((CASE (\A b3252 \in SUBSET {1} : FALSE) -> (CHOOSE b3253 \in Nat : FALSE) [] OTHER -> (-2147483647) < IF (1..3 \subseteq 1..3) THEN (CHOOSE b3254 \in {1} : TRUE) ELSE (TRUE \/ TRUE)) => (SubSeq(SubSeq(<<1, 2>>, 7, 7), (-1 % 3), (-0)) = [(<<1>> \o <<1>>) EXCEPT ![1] = (7 - 1)])))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02046 failed.
    2183:0 The second argument of SubSeq must be in the domain of its first argument:
    <<1, 2>>
    , but instead it is
    7
---*)

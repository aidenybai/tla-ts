(*---
description: Evaluates a random int expression, seed 262, number 2891.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02891 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((IF ((<<1, 2>> \ 1..3) = (7 .. 2147483647)) THEN CASE (TRUE /\ TRUE) -> CASE FALSE -> -1 [] OTHER -> {x \in 1..3 : x > 1} [] OTHER -> (CHOOSE b4576 \in 2 : FALSE) ELSE ((2147483647 - 1) - Cardinality(<<1, 2>>)) + (CHOOSE b4577 \in (Cardinality({1}) .. Cardinality({2, 1, 3})) : ([<<5, 6>> EXCEPT ![2] = 0] = (b4577 + 1..3)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02891 failed.
    Attempted to enumerate S \ T when S:
    <<1, 2>>
    is not enumerable.
---*)

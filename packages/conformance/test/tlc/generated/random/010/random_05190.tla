(*---
description: Evaluates a random bool expression, seed 262, number 5190.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05190 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((CASE (\E b8047 \in {2147483647, 1} : (~FALSE)) -> IF ([a |-> 1] = [a |-> 1]) THEN (1 + 1) ELSE (-7) [] OTHER -> CASE (TRUE <=> FALSE) -> Len(<<1, 2>>) [] OTHER -> Head(<<1, 2>>) = CASE ((~FALSE) /\ (7 \in {x \in 1..3 : x > 1})) -> DOMAIN [<<5, 6>> EXCEPT ![3] = 1] [] OTHER -> ((1 * 1) % CASE TRUE -> [x \in 1..2 |-> x] [] OTHER -> 1)))
====

(*--- recorded
all:
  exit: 0
  transcript: "| 2"
---*)

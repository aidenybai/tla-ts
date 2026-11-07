(*---
description: Evaluates a random bool expression, seed 262, number 3919.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03919 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((CASE ((1 :> 2) <=> FALSE) -> (2147483647 \div 0) [] OTHER -> CASE TRUE -> -1 [] OTHER -> 1 % CASE (1 \in {1}) -> ([a |-> 1]).a [] OTHER -> IF FALSE THEN -1 ELSE <<3, 1, 2>>) \in {([[x \in 1..2 |-> x] EXCEPT ![7] = b6184])[IF TRUE THEN -1 ELSE b6184] : b6184 \in UNION {(0 .. 2), (7 .. 7)}}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03919 failed.
    Attempted to evaluate an expression of form P <=> Q when P or Q was not a boolean.
    line 14, col 24 to line 14, col 41 of module random_03919
---*)

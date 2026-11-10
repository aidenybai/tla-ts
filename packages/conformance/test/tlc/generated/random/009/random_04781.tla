(*---
description: Evaluates a random function expression, seed 262, number 4781.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04781 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((CHOOSE b7463 \in UNION {{}, {}} : ([a |-> 1, b |-> TRUE] = [a |-> 1, b |-> TRUE])) * LET b7464 == LET b7465 == 3 IN 7 IN (-b7464)) :> CASE ((1 .. 2) = DOMAIN <<5, 6>>) -> ((7 - 1) - (0 - 2)) [] OTHER -> (((1 :> 2) @@ [x \in 1..2 |-> x]))[Head(Nat)]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04781 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 19 to line 14, col 99 of module random_04781
---*)

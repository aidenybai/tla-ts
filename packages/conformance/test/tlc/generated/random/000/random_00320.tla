(*---
description: Evaluates a random set expression, seed 262, number 320.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00320 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((CHOOSE b533 \in ((2..1 \ <<1>>) \cup [[a |-> 1, b |-> TRUE] EXCEPT !.a = @ + 1]) : ([<<1, 2>> EXCEPT ![1] = b533] = (b533 :> 7))) .. CASE ((\E b534 \in {x \in 1..3 : x > 1} : FALSE) => [[a |-> 1, b |-> TRUE] EXCEPT !.a = @ + 1]) -> (CHOOSE b535 \in (Nat \cup Nat) : (FALSE => TRUE)) [] OTHER -> (IF TRUE THEN 0 ELSE 1 * IF FALSE THEN 0 ELSE 2)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00320 failed.
    Attempted to compute the value of an expression of
    form CHOOSE x \in S: P, but S was not enumerable.
    line 14, col 18 to line 14, col 145 of module random_00320
---*)

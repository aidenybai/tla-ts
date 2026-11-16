(*---
description: Evaluates a random record expression, seed 262, number 7303.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07303 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[[[[a |-> 1, b |-> TRUE] EXCEPT !.a = 2] EXCEPT !.a = (CHOOSE b11250 \in <<1, 2>> : FALSE)] EXCEPT !.a = @ + (IF TRUE THEN 0 ELSE 1 + (CHOOSE b11251 \in Nat : TRUE))] EXCEPT !.a = @ + (CHOOSE b11252 \in (DOMAIN [x \in 1..2 |-> x] \cap {7 : b11253 \in Nat}) : ((b11252 < b11252) => ({x \in 1..3 : x > 1} \subseteq 1..3)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07303 failed.
    Attempted to compute the value of an expression of
    form CHOOSE x \in S: P, but S was not enumerable.
    line 14, col 72 to line 14, col 105 of module random_07303
---*)

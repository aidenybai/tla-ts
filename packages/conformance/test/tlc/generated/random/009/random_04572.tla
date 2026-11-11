(*---
description: Evaluates a random record expression, seed 262, number 4572.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04572 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[[[[a |-> 1, b |-> TRUE] EXCEPT !.a = @ + 3] EXCEPT !.a = @ + ([a |-> 1, b |-> TRUE]).a] EXCEPT !.a = @ + CASE (1..3 \subseteq {1}) -> ([a |-> 1]).a [] OTHER -> ([a |-> 1]).a] EXCEPT !.a = @ + ((Head(FALSE) * [a |-> 2147483647, b |-> <<1, 2>>]) % (CHOOSE b7175 \in {0 : b7176 \in {}} : (b7175 < b7175)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04572 failed.
    2283:0 The argument of Head should be a sequence, but instead it is:
    FALSE
---*)

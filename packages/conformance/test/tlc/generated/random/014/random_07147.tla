(*---
description: Evaluates a random record expression, seed 262, number 7147.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07147 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[(CHOOSE r \in [a : 1..2] : TRUE) EXCEPT !.a = [[[a |-> 1] EXCEPT !.a = @ + -1] EXCEPT !.a = @ + (0 + 3)]] EXCEPT !.a = @ + ([(<<1, 2>> \o <<>>) EXCEPT ![1] = CASE FALSE -> <<>> [] OTHER -> 1])[(([x \in Nat |-> x + 1])[1] - (2 + 2))]])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07147 failed.
    Attempted to access index -2 of tuple
    <<1, 2>>
    which is out of bounds.
---*)

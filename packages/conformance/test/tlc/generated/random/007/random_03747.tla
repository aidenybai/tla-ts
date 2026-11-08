(*---
description: Evaluates a random record expression, seed 262, number 3747.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03747 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[(CHOOSE r \in [a : {1, 2} \cap {2}] : TRUE) EXCEPT !.a = ((<<5, 6>> @@ FALSE))[Len(<<1>>)]] EXCEPT !.a = Head(([<<>> EXCEPT ![1] = 3] \o Tail(<<1, 2>>)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03747 failed.
    2169:0 The second argument of @@ should be a function, but instead it is:
    FALSE
---*)

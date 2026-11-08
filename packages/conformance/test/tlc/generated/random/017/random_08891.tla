(*---
description: Evaluates a random record expression, seed 262, number 8891.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08891 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a |-> (([[a |-> 1, b |-> TRUE] EXCEPT !.a = -1]).a * ((1 - 1) % CASE TRUE -> 0 [] OTHER -> FALSE)), b |-> [b13773 \in ((SUBSET {1} \ {x \in 1..3 : x > 1}) \cup ({2, 1, 3} \ {1})) |-> Len([<<1, 2>> EXCEPT ![1] = b13773])]])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08891 failed.
    2169:0 The second argument of % should be a positive number, but instead it is:
    0
---*)

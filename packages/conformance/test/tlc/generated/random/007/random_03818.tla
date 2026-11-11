(*---
description: Evaluates a random record expression, seed 262, number 3818.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03818 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[a |-> Head(([x \in 1..2 |-> x] @@ (1 :> 2))), b |-> ({<<1>>, 3} \subseteq {b6018 \in {} : FALSE})] EXCEPT !.a = @ + ((Len(<<>>) \div (-1 - -1)) - (Head(<<3, 1, 2>>) % (TRUE => FALSE)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03818 failed.
    Attempted to compare integer 3 with non-integer:
    <<1>>
---*)

(*---
description: Evaluates a random record expression, seed 262, number 4957.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04957 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a |-> LET b7711 == [[<<1>> EXCEPT ![1] = 2147483647] EXCEPT ![1] = (-3)] IN (((1 :> 2))[b7711] - [<<5, 6>> EXCEPT ![b7711] = 7]), b |-> [a |-> (-LET b7712 == 2147483647 IN 0), b |-> (\E b7713 \in ({x \in 1..3 : x > 1} \ {2, 1, 3}) : (TRUE => FALSE))]])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04957 failed.
    Attempted to check equality of integer 1 with non-integer:
    <<-3>>
---*)

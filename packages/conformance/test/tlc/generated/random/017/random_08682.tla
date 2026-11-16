(*---
description: Evaluates a random record expression, seed 262, number 8682.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08682 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[a |-> Cardinality(({} \cap 1..3)), b |-> (\E b13443 \in [a |-> 2, b |-> FALSE] : ([a |-> 1] = [a |-> 1, b |-> TRUE]))] EXCEPT !.a = @ + LET b13444 == ((<<1>> + 2147483647) + Len(<<1, 2>>)) IN ((3 * 2) :> (-b13444))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08682 failed.
    TLC encountered a non-enumerable quantifier bound
    [a |-> 2, b |-> FALSE].
    line 14, col 74 to line 14, col 95 of module random_08682
---*)

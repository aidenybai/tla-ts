(*---
description: Evaluates a random record expression, seed 262, number 7241.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07241 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[a |-> ((CHOOSE r \in [a : {1, 2}] : TRUE)).a, b |-> ((CHOOSE r \in [a : {1, 2}] : TRUE) = [a |-> 3, b |-> FALSE])] EXCEPT !.a = @ + ((Len(<<1>>) % (1 + 0)) \div ([b11132 \in {2, 1, 3} |-> b11132])[(2147483647 % 2147483647)])])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07241 failed.
    In applying the function
    <<1, 2, 3>>,
    the first argument is:
    0
    which is not in its domain.
---*)

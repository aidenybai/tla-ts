(*---
description: Evaluates a random record expression, seed 262, number 3862.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03862 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[a |-> ((0 \div 2147483647) % (2 - 3)), b |-> (Tail(<<1, 2>>) = [b6086 \in {1} |-> b6086])] EXCEPT !.a = @ + (CHOOSE b6087 \in ({b6088 \in {2, 1, 3} : TRUE} \cup ({1} \ {x \in 1..3 : x > 1})) : (Head(<<3, 1, 2>>) = (<<>> + 7)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03862 failed.
    2169:0 The second argument of % should be a positive number, but instead it is:
    -1
---*)

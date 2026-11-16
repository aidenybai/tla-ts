(*---
description: Evaluates a random record expression, seed 262, number 9668.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09668 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a |-> Len((DOMAIN [x \in 1..2 |-> x] \cup (SUBSET {1} \cap 1..3))), b |-> (\E b15003 \in ((SUBSET {1} \cap <<1>>) \cup [b15004 \in {1, 2} |-> b15004]) : (SortSeq(<<1>>, LAMBDA p, q : p < q) = [b15005 \in {2, 1, 3} |-> b15003]))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09668 failed.
    Attempted to check if the non-enumerable value
    1
    is element of
    {{}, {1}}
---*)

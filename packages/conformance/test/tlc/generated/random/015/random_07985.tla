(*---
description: Evaluates a random record expression, seed 262, number 7985.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07985 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[a |-> (DOMAIN [x \in 1..2 |-> x] \ ({1, 2} \cap {2, 1, 3})), b |-> (CHOOSE r \in [a : 1..2] : TRUE)] EXCEPT !.a = [[b12334 \in (<<>> \o {x \in 1..3 : x > 1}) |-> (3 - b12334)] EXCEPT ![(SortSeq(<<1, 2>>, LAMBDA p, q : p < q) \o SubSeq(<<3, 1, 2>>, 2147483647, 0))] = Len(Append(<<1, 2>>, 2))]])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2182:0 Evaluating an expression of the form t \o s when s is not a sequence:
    {2, 3}
    2182:0 Evaluating an expression of the form t \o s when s is not a sequence:
    {2, 3}
---*)

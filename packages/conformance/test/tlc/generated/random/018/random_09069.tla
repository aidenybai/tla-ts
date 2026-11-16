(*---
description: Evaluates a random function expression, seed 262, number 9069.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09069 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((LET b14096 == ([a |-> 1, b |-> TRUE]).a IN ([a |-> 1, b |-> TRUE]).a :> Cardinality(({x \in 1..3 : x > 1} \ SUBSET {1}))) @@ [(([a |-> 1]).a :> {2147483647, -1}) EXCEPT ![((CHOOSE r \in [a : 1..2] : TRUE)).a] = Len(SubSeq(<<1>>, <<5, 6>>, 0))]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09069 failed.
    Attempted to check if the non-enumerable value
    2
    is element of
    {{}, {1}}
---*)

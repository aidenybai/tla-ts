(*---
description: Evaluates a random function expression, seed 262, number 8036.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08036 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((((<<5, 6>>)[2147483647] * IF FALSE THEN 2147483647 ELSE 2147483647) :> (SortSeq(<<1, 2>>, LAMBDA p, q : p < q) \o Tail(<<1, 2>>))) @@ (((<<>> \o <<>>) @@ (7 :> -1)) @@ (CHOOSE f \in [{1, 2} \ {1} -> {2, 1, 3}] : TRUE))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08036 failed.
    Attempted to access index 2147483647 of tuple
    <<5, 6>>
    which is out of bounds.
---*)

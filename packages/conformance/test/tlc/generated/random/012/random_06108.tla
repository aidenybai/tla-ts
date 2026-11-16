(*---
description: Evaluates a random function expression, seed 262, number 6108.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06108 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([[b9399 \in ([a |-> 1, b |-> TRUE] = [a |-> 1]) |-> Head(<<1, 2>>)] EXCEPT ![CASE (1 = 2147483647) -> (<<1, 2>> = [x \in 1..2 |-> x]) [] OTHER -> SubSeq(<<1, 2>>, 1, -1)] = Cardinality((7 \subseteq {1}))] @@ ((Cardinality(2147483647) :> Len(<<3, 1, 2>>)) @@ (CHOOSE f \in [2..1 -> {0} \cup {1}] : TRUE))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06108 failed.
    Attempted to check if the value:
    <<>>
    is an element of the boolean FALSE
---*)

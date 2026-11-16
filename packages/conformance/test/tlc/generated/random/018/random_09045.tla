(*---
description: Evaluates a random record expression, seed 262, number 9045.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09045 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a |-> (CHOOSE b14047 \in {b14048 \in DOMAIN [x \in Nat |-> x + 1] : ([a |-> 1] = [a |-> 1])} : (CASE TRUE -> b14047 [] OTHER -> b14047 < Len({x \in 1..3 : x > 1}))), b |-> ((CHOOSE b14049 \in {2147483647 : b14050 \in 1..3} : ([a |-> 1, b |-> TRUE] = [a |-> 1, b |-> TRUE])) \in ({-1, -1} \cup ({2, 1, 3} \cap 1..3)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09045 failed.
    Attempted to enumerate { x \in S : p(x) } when S:
    Nat
    is not enumerable
---*)

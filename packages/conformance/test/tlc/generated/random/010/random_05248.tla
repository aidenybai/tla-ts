(*---
description: Evaluates a random function expression, seed 262, number 5248.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05248 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[b8124 \in DOMAIN [(1 :> 2) EXCEPT ![[x \in Nat |-> x + 1]] = -1] |-> (([a |-> 1, b |-> TRUE]).a - (2 % b8124))] EXCEPT ![({(TRUE + -1), (1 + 1)} % ({2, -1} \ (-1 .. <<1>>)))] = ((Cardinality(1..3) * ([a |-> 1, b |-> TRUE]).a) + Head(SubSeq(<<1, 2>>, -1, <<1>>)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05248 failed.
    Attempted to check equality of integer 1 with non-integer:
    [x \in Nat |-> <expression line 14, col 69 to line 14, col 73 of module random_05248>]
---*)

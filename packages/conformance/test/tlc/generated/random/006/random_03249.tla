(*---
description: Evaluates a random function expression, seed 262, number 3249.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03249 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([b5168 \in ((DOMAIN [a |-> 1, b |-> TRUE] \subseteq {2, 1}) => (([a |-> 1]).a < Cardinality({2, 1, 3}))) |-> (((<<5, 6>> @@ [x \in 1..2 |-> x]) @@ (<<5, 6>> @@ [x \in Nat |-> x + 1])))[Head(Append(<<3, 1, 2>>, -1))]])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03249 failed.
    Attempted to check equality of integer 2 with non-integer:
    "a"
---*)

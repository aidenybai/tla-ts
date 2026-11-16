(*---
description: Evaluates a random function expression, seed 262, number 2740.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02740 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([b4327 \in DOMAIN [[b4328 \in {x \in 1..3 : x > 1} |-> 7] EXCEPT ![Tail(<<1>>)] = ([x \in Nat |-> x + 1])[2]] |-> (({b4327, b4327} \cup UNION {{1, 2}, 1..3}) \ ((SUBSET {1} \cup {x \in 1..3 : x > 1}) \cap (3 .. 0)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02740 failed.
    Attempted to check equality of integer 2 with non-integer:
    <<>>
---*)

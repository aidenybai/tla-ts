(*---
description: Evaluates a random function expression, seed 262, number 3199.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03199 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([b5084 \in (((0 :> 2))[Cardinality(1..3)] .. (IF FALSE THEN 3 ELSE 1 - (2 * <<1, 2>>))) |-> (DOMAIN ([x \in 1..2 |-> x] @@ [x \in Nat |-> x + 1]) \cup {(b5084 + 0), ([x \in Nat |-> x + 1])[3]})])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03199 failed.
    Attempted to apply function:
    (0 :> 2)
    to argument 3, which is not in the domain of the function.
---*)

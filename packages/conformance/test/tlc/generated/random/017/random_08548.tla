(*---
description: Evaluates a random function expression, seed 262, number 8548.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08548 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((((2 * 3) :> LET b13247 == 0 IN b13247) @@ (((1 :> 2))[TRUE] :> (0 % 0))) @@ [b13248 \in {b13249 \in {b13250 \in {1, 2} : TRUE} : (2147483647 \in {x \in 1..3 : x > 1})} |-> LET b13251 == Cardinality(Nat) IN (b13248 - 2)]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08548 failed.
    Attempted to check equality of integer 1 with non-integer:
    TRUE
---*)

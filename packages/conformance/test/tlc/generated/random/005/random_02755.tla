(*---
description: Evaluates a random bool expression, seed 262, number 2755.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02755 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({((<<5, 6>> @@ (1 :> 2)))[IF TRUE THEN (1 :> 2) ELSE -1], ((2147483647 - 2147483647) % Cardinality({1}))} \subseteq {LET b4348 == (<<3, 1, 2>> = [x \in 1..2 |-> x]) IN LET b4349 == <<1>> IN b4349, ((-1 \div 0) \div IF TRUE THEN 7 ELSE 3)}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02755 failed.
    Attempted to check equality of integer 1 with non-integer:
    <<2>>
---*)

(*---
description: Evaluates a random record expression, seed 262, number 2922.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02922 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[a |-> CASE (2147483647 = [a |-> 1]) -> IF FALSE THEN 2 ELSE {x \in 1..3 : x > 1} [] OTHER -> ([x \in Nat |-> x + 1] @@ [a |-> 1, b |-> TRUE]), b |-> ([<<3, 1, 2>> EXCEPT ![1] = 0] = [(1 :> 2) EXCEPT ![1] = 1])] EXCEPT !.a = @ + (Cardinality({b4618 \in Nat : TRUE}) \div ((7 \div 2147483647) * CASE FALSE -> 1 [] OTHER -> [x \in Nat |-> x + 1]))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02922 failed.
    Attempted to check equality of integer 2147483647 with non-integer:
    [a |-> 1]
---*)

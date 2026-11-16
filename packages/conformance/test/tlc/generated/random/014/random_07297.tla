(*---
description: Evaluates a random function expression, seed 262, number 7297.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07297 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([b11235 \in ((CHOOSE b11236 \in {2147483647, 1} : (b11236 = [x \in Nat |-> x + 1])) .. ((0 :> 1))[(CHOOSE b11237 \in {} : FALSE)]) |-> (Cardinality(({2, 1, 3} \cup 2..1)) + IF (\E b11238 \in {2, 1, 3} : TRUE) THEN (CHOOSE b11239 \in {1} : FALSE) ELSE (3 % b11235))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07297 failed.
    Attempted to check equality of integer 1 with non-integer:
    [x \in Nat |-> <expression line 14, col 91 to line 14, col 95 of module random_07297>]
---*)

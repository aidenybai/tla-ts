(*---
description: Evaluates a random function expression, seed 262, number 288.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00288 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([b486 \in (Len(<<3, 1, 2>>) .. ((1 :> 2))[SUBSET {1}]) |-> Cardinality(UNION {{}, {2, 1, 3}})] @@ ([(-1 :> 1) EXCEPT ![([x \in 1..2 |-> x] % -1)] = (3 * 7)] @@ [[[x \in 1..2 |-> x] EXCEPT ![2] = 2] EXCEPT ![(<<1>> \o <<1, 2>>)] = ([x \in Nat |-> x + 1])[<<5, 6>>]])))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00288 failed.
    Attempted to check equality of integer 1 with non-integer:
    {{}, {1}}
---*)

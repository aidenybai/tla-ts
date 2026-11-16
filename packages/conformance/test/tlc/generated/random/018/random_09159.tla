(*---
description: Evaluates a random set expression, seed 262, number 9159.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09159 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(UNION {(({b14224 \in {} : FALSE} \cap ({2, 1, 3} \cup {})) \cup UNION {{0 : b14225 \in 1..3}, {2, [x \in Nat |-> x + 1]}}), (((<<5, 6>> @@ <<5, 6>>))[DOMAIN [x \in 1..2 |-> x]] .. Cardinality(DOMAIN [x \in 1..2 |-> x]))})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09159 failed.
    Attempted to check equality of integer 0 with non-integer:
    [x \in Nat |-> <expression line 14, col 129 to line 14, col 133 of module random_09159>]
---*)

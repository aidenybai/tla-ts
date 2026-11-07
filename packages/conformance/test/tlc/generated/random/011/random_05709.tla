(*---
description: Evaluates a random set expression, seed 262, number 5709.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05709 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((DOMAIN [[[x \in Nat |-> x + 1] EXCEPT ![[x \in Nat |-> x + 1]] = 3] EXCEPT ![(7 \div <<1>>)] = Head(<<>>)] \cup UNION {(UNION {Nat, 1..3} \cap UNION {{x \in 1..3 : x > 1}, SUBSET {1}}), DOMAIN ([x \in Nat |-> x + 1] @@ [x \in 1..2 |-> x])}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2158:0 Attempted to check if the value:
    [x \in Nat |-> <expression line 14, col 72 to line 14, col 76 of module random_05709>]
    is an element of Nat.
    2158:0 Attempted to check if the value:
    [x \in Nat |-> <expression line 14, col 72 to line 14, col 76 of module random_05709>]
    is an element of Nat.
---*)

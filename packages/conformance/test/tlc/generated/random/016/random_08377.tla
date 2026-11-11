(*---
description: Evaluates a random seq expression, seed 262, number 8377.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08377 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([b12957 \in {b12958 \in UNION {(1..3 \ 2..1), {b12959 : b12959 \in {1, 2}}} : ({b12960 \in {1} : FALSE} = DOMAIN [x \in Nat |-> x + 1])} |-> (LET b12961 == (2 - 2147483647) IN (0 % 0) \div Head(SelectSeq(<<3, 1, 2>>, LAMBDA e : e > 0)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08377 failed.
    Attempted to check equality of the set {} with the value:
    Nat
---*)

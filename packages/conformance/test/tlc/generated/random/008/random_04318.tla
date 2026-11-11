(*---
description: Evaluates a random function expression, seed 262, number 4318.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04318 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([b6808 \in {(([x \in 1..2 |-> x])[-1] + LET b6809 == 2147483647 IN 2), CASE (TRUE \/ TRUE) -> Len(<<3, 1, 2>>) [] OTHER -> Head(<<3, 1, 2>>)} |-> LET b6810 == Cardinality(DOMAIN [x \in Nat |-> x + 1]) IN (Cardinality(2..1) % (b6810)[2147483647])])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04318 failed.
    In applying the function
    <<1, 2>>,
    the first argument is:
    -1
    which is not in its domain.
---*)

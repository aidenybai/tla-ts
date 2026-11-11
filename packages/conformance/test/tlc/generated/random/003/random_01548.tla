(*---
description: Evaluates a random function expression, seed 262, number 1548.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01548 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[b2465 \in UNION {{b2466 : b2466 \in 2..1}, (1..3 \ Nat)} |-> Head(LET b2467 == b2465 IN 3)] EXCEPT ![(Tail(SortSeq(<<1, 2>>, LAMBDA p, q : p < q))).a] = Cardinality(UNION {{b2468 \in {x \in 1..3 : x > 1} : FALSE}, (1 .. 3)})])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01548 failed.
    Attempted to apply function with integer domain to the non-integer argument "a"
---*)

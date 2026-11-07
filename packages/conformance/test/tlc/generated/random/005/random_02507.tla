(*---
description: Evaluates a random bool expression, seed 262, number 2507.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02507 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({b3947 \in {(b3948 \div b3948) : b3948 \in (-1 .. -1)} : (Head(<<1, 2>>) => (TRUE /\ FALSE))} = (((0 % 0) % Cardinality({1, 2})) % Len(SortSeq(<<1>>, LAMBDA p, q : p < q)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02507 failed.
    Attempted to evaluate an expression of form P => Q when P was
    an integer.
    line 14, col 75 to line 14, col 107 of module random_02507
---*)

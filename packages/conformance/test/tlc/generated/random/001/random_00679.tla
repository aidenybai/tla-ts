(*---
description: Evaluates a random set expression, seed 262, number 679.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00679 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({CASE ([[a |-> 1] EXCEPT !.a = @ + 7] = ({x \in 1..3 : x > 1} \cap Nat)) -> (Head(<<3, 1, 2>>) + LET b1136 == 7 IN 2) [] OTHER -> IF (<<1>> \in 2..1) THEN ([a |-> 1, b |-> TRUE]).a ELSE (1 \div Nat), ([[a |-> 1, b |-> FALSE] EXCEPT !.a = @ + ([a |-> 1]).a] * ([a |-> 3, b |-> FALSE]).a)})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00679 failed.
    Attempted to check equality of record:
    [a |-> 8]
    with non-record
    {2, 3}
---*)

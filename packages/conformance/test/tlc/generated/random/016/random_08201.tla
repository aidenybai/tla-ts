(*---
description: Evaluates a random function expression, seed 262, number 8201.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08201 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([b12689 \in {(IF TRUE THEN b12690 ELSE 0 % (b12690 * 3)) : b12690 \in {SubSeq(<<3, 1, 2>>, 2, 0), (7 * 1)}} |-> CASE (((1 :> 2))[b12689] = Cardinality({1})) -> (Head(<<1, 2>>) % (2147483647 % 2)) [] OTHER -> (([a |-> 1, b |-> TRUE]).a % LET b12691 == b12689 IN 2)])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08201 failed.
    Attempted to compare integer 7 with non-integer:
    <<>>
---*)

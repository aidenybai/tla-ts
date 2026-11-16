(*---
description: Evaluates a random bool expression, seed 262, number 7055.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07055 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((\E b10830 \in {b10831 \in {(CHOOSE b10833 \in {2, 1, 3} : FALSE) : b10832 \in UNION {1..3, [a |-> 1, b |-> TRUE]}} : (Head(<<>>) = (b10831 + b10831))} : (((CHOOSE b10834 \in 2..1 : TRUE) - DOMAIN [x \in Nat |-> x + 1]) = Head((<<3, 1, 2>> \o <<3, 1, 2>>)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07055 failed.
    Attempted to compare record:
    [a |-> 1, b |-> TRUE]
    with non-record
    1..3
---*)

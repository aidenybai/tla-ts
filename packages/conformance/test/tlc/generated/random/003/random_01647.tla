(*---
description: Evaluates a random function expression, seed 262, number 1647.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01647 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([b2631 \in {(UNION {Nat, SUBSET {1}} \subseteq (b2632 .. b2632)) : b2632 \in {b2633 \in [a |-> 3, b |-> FALSE] : (\E b2634 \in {1, 2} : TRUE)}} |-> Len(SortSeq([<<>> EXCEPT ![1] = b2631], LAMBDA p, q : p < q))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01647 failed.
    Attempted to enumerate { x \in S : p(x) } when S:
    [a |-> 3, b |-> FALSE]
    is not enumerable
---*)

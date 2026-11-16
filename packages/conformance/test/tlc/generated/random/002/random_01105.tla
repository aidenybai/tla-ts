(*---
description: Evaluates a random bool expression, seed 262, number 1105.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01105 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((\E b1762 \in UNION {(([a |-> 1, b |-> TRUE] \cap Nat) \cup (2..1 \cap {1, 2})), {b1763 \in {b1764 \in {} : 2..1} : ([a |-> 1, b |-> TRUE] = [a |-> 1, b |-> TRUE])}} : (\E b1765 \in {(b1762 = 7) : b1766 \in (b1762 .. b1762)} : Len(SortSeq(<<1, 2>>, LAMBDA p, q : p < q)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01105 failed.
    Attempted to enumerate S \cap T when neither S:
    [a |-> 1, b |-> TRUE]
    nor T:
    Nat
    is enumerable
---*)

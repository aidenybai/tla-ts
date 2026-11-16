(*---
description: Evaluates a random int expression, seed 262, number 2483.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02483 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(CASE ((([a |-> 1, b |-> TRUE]).a + (-2147483647)) \in {b3904 \in UNION {{2, 1, 3}, {}} : (1..3 = [a |-> 1, b |-> TRUE])}) -> Cardinality({b3905 \in ({2, 1, 3} \cap Nat) : (b3905 < b3905)}) [] OTHER -> Head(SelectSeq(Append(<<1, 2>>, 2147483647), LAMBDA e : e > 0)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02483 failed.
    Attempted to check equality of the set {1, 2, 3} with the value:
    [a |-> 1, b |-> TRUE]
---*)

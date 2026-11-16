(*---
description: Evaluates a random set expression, seed 262, number 7684.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07684 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({b11836 \in ({Cardinality(b11837) : b11837 \in UNION {Nat, Nat}} \cap {b11838 \in [[a |-> 1] EXCEPT !.a = @ + 1] : (~TRUE)}) : (IF (3 = b11836) THEN Head(<<3, 1, 2>>) ELSE Head(<<1>>) \in ((0 % 1) .. Cardinality({x \in 1..3 : x > 1})))})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07684 failed.
    Attempted to enumerate UNION(s), but some element of s is nonenumerable.
---*)

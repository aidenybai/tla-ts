(*---
description: Evaluates a random set expression, seed 262, number 4907.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04907 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(UNION {(UNION {{2, {}}, (2 .. 0)} \cup Len(SubSeq(<<1>>, 1, SUBSET {1}))), UNION {UNION {(SUBSET {1} \cap {1, 2}), UNION {{x \in 1..3 : x > 1}, Nat}}, {b7637 \in {b7638 : b7638 \in SUBSET {1}} : (Nat = Nat)}}})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04907 failed.
    2169:0 The third argument of SubSeq should be a natural number, but instead it is:
    {{}, {1}}
---*)

(*---
description: Evaluates a random bool expression, seed 262, number 6496.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06496 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((\A b9990 \in ((({} \ [a |-> 1]) \cap ({1, 2} \cup {2, 1, 3})) \cup UNION {{b9991 \in [a |-> 1, b |-> TRUE] : FALSE}, (0 .. 7)}) : ({IF FALSE THEN b9990 ELSE b9990, Head(<<1>>)} \subseteq ((1 % 0) .. Head(<<>>)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06496 failed.
    Attempted to enumerate { x \in S : p(x) } when S:
    [a |-> 1, b |-> TRUE]
    is not enumerable
---*)

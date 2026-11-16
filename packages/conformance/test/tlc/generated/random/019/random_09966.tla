(*---
description: Evaluates a random int expression, seed 262, number 9966.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09966 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(CASE (UNION {({1, 2} \cap {x \in 1..3 : x > 1}), ({x \in 1..3 : x > 1} \cup {x \in 1..3 : x > 1})} \cap ((1 + 0) .. (-1 \div 0))) -> Head(SortSeq(Tail(<<3, 1, 2>>), LAMBDA p, q : p < q)) [] OTHER -> (CHOOSE b15491 \in ((3 % 1) .. Len(<<1, 2>>)) : (Len(<<1, 2>>) \in {b15491, 2})))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09966 failed.
    2179:0 The second argument of \div is 0.
---*)

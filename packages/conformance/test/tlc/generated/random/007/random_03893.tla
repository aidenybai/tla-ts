(*---
description: Evaluates a random set expression, seed 262, number 3893.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03893 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({b6130 \in {(1 \div <<3, 1, 2>>) : b6131 \in ([a |-> 1, b |-> TRUE] \cup 2..1)} : ({b6130, 3} \subseteq (2..1 \ FALSE))} \cup ({([a |-> 1, b |-> TRUE]).a : b6132 \in UNION {FALSE, 2..1}} \cap ({b6133 \in 2..1 : TRUE} \cup (2..1 \cup [x \in Nat |-> x + 1])))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03893 failed.
    TLC encountered a non-enumerable quantifier bound
    [a |-> 1, b |-> TRUE].
    line 14, col 63 to line 14, col 93 of module random_03893
---*)

(*---
description: Evaluates a random set expression, seed 262, number 9134.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09134 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(UNION {({b14180 \in ({1, 2} \cup 2..1) : (\E b14181 \in 2..1 : TRUE)} \cap {(2147483647 * 0), (7 + -1)}), {b14182 \in {([a |-> 1, b |-> TRUE]).a, (3 - 0)} : (\E b14183 \in ({} \cup {x \in 1..3 : x > 1}) : (0 = 1..3))}})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09134 failed.
    Attempted to check equality of integer 0 with non-integer:
    1..3
---*)

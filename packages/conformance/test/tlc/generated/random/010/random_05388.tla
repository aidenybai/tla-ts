(*---
description: Evaluates a random function expression, seed 262, number 5388.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05388 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(UNION {{(([a |-> 1, b |-> TRUE])[1] \div CASE FALSE -> 1 [] OTHER -> b8332) : b8332 \in {(b8333 * [a |-> 1]) : b8333 \in {b8334 \in Nat : TRUE}}}, (((SUBSET {1} \ 1..3) \cap {b8335 \in [a |-> 1] : FALSE}) \cup ((TRUE \/ FALSE) \ {b8336 \in 1..3 : FALSE}))})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05388 failed.
    Attempted to enumerate { x \in S : p(x) } when S:
    Nat
    is not enumerable
---*)

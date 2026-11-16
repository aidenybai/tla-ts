(*---
description: Evaluates a random set expression, seed 262, number 2770.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02770 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({IF (\A b4372 \in {b4373 \in {2, 1, 3} : FALSE} : (TRUE => FALSE)) THEN Head(Tail(<<3, 1, 2>>)) ELSE ((TRUE :> 1))[(-b4371)] : b4371 \in UNION {(IF FALSE THEN -1 ELSE 0 .. Head(<<1>>)), {(CHOOSE b4375 \in {} : FALSE) : b4374 \in {b4376 \in Nat : FALSE}}}})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02770 failed.
    Attempted to enumerate { x \in S : p(x) } when S:
    Nat
    is not enumerable
---*)

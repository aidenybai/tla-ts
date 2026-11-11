(*---
description: Evaluates a random function expression, seed 262, number 2312.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02312 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([b3659 \in ((([a |-> 1] = [a |-> 1]) \cap {2147483647, 0}) \cap UNION {(7 .. 3), (2..1 \ {2, 1, 3})}) |-> ([b3660 \in DOMAIN <<5, 6>> |-> SubSeq(<<1, 2>>, 1, b3659)])[(([a |-> 1, b |-> TRUE]).a + (b3659 \div 7))]])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02312 failed.
    Attempted to check if the value:
    2147483647
    is an element of the boolean TRUE
---*)

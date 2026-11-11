(*---
description: Evaluates a random set expression, seed 262, number 6896.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06896 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(UNION {UNION {(({1, 2} \cap 3) \ ({1} \ Nat)), {(0 \div 7) : b10559 \in {-1, 7}}}, {b10560 \in {Len(<<1>>) : b10561 \in {2147483647, 2}} : (DOMAIN [x \in 1..2 |-> x] \subseteq {b10560, b10560})}})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06896 failed.
    Attempted to check if the value:
    1
    is an element of the integer 3
---*)

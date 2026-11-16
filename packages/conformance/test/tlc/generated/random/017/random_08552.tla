(*---
description: Evaluates a random function expression, seed 262, number 8552.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08552 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((((7 * 2147483647) % ([a |-> 1, b |-> TRUE] % 7)) :> IF (\A b13255 \in {x \in 1..3 : x > 1} : FALSE) THEN IF TRUE THEN 1 ELSE 3 ELSE (2 \div 3)))[Len(Append(SelectSeq(<<>>, LAMBDA e : e > 0), (-7)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08552 failed.
    2178:0 Overflow when computing 7*2147483647
---*)

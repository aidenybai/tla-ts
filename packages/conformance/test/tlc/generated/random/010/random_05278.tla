(*---
description: Evaluates a random int expression, seed 262, number 5278.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05278 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([a |-> [<<0, 2147483647>> EXCEPT ![1] = CASE TRUE -> [a |-> 1] [] OTHER -> -1], b |-> (\E b8171 \in DOMAIN [x \in 1..2 |-> x] : ([a |-> 1] = [x \in 1..2 |-> x]))] \div ((-Head(<<1>>)) % ((1)[-1] % (2147483647 \div 7)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05278 failed.
    Attempted to check equality of record:
    [a |-> 1]
    with non-record
    <<1, 2>>
---*)

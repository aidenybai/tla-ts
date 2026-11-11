(*---
description: Evaluates a random function expression, seed 262, number 4108.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04108 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[[UNION {{1}, [a |-> 1]} EXCEPT ![(CHOOSE b6454 \in Nat : TRUE)] = Head(<<1, 2>>)] EXCEPT ![Len([<<1, 2>> EXCEPT ![1] = 7])] = (([a |-> 1, b |-> TRUE]).a \div LET b6455 == -1 IN b6455)] EXCEPT ![CASE ({FALSE : b6456 \in 2..1} = UNION {2..1, {x \in 1..3 : x > 1}}) -> Head(SelectSeq(<<1>>, LAMBDA e : e > 0)) [] OTHER -> IF ([a |-> 1] = [a |-> 1, b |-> TRUE]) THEN IF FALSE THEN 2147483647 ELSE 2147483647 ELSE (-1)] = (Head([<<1, 2>> EXCEPT ![1] = -1]) + Head(SelectSeq(<<1>>, LAMBDA e : e > 0)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04108 failed.
    Attempted to compute the value of an expression of
    form CHOOSE x \in S: P, but S was not enumerable.
    line 14, col 52 to line 14, col 78 of module random_04108
---*)

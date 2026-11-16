(*---
description: Evaluates a random function expression, seed 262, number 4002.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04002 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[[b6291 \in ({x \in 1..3 : x > 1} \cap 2..1) |-> Head(<<>>)] EXCEPT ![([[a |-> 1] EXCEPT !.a = @ + 7]).a] = ((<<1>> % 0) - (0 % 3))] EXCEPT ![(((1 \div 3) + (1 % 2)) - ([<<1>> EXCEPT !.a = @ + 1]).a)] = ([[[x \in Nat |-> x + 1] EXCEPT ![-1] = 1] EXCEPT ![CASE TRUE -> 3 [] OTHER -> 7] = (2147483647 + TRUE)])[CASE (2147483647 < -1) -> (7 * 2147483647) [] OTHER -> Len(<<1, 2>>)]])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 18 to line 14, col 76 of module random_04002
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04002 failed.
    Attempted to access tuple at a non integral index: "a"
---*)

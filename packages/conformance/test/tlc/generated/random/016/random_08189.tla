(*---
description: Evaluates a random function expression, seed 262, number 8189.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08189 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([b12660 \in ((DOMAIN [x \in 1..2 |-> x] \cup (2147483647 .. 2)) \cup {[[a |-> 1] EXCEPT !.a = @ + 1], Tail(<<3, 1, 2>>)}) |-> (CASE (b12660 < 1) -> ([a |-> 1])[3] [] OTHER -> CASE TRUE -> b12660 [] OTHER -> FALSE % (CASE FALSE -> 7 [] OTHER -> 1 % Head(b12660)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08189 failed.
    Attempted to check equality of integer 1 with non-integer:
    [a |-> 2]
---*)

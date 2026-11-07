(*---
description: Evaluates a random bool expression, seed 262, number 975.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00975 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((\A b1570 \in {b1571 \in UNION {{b1572 \in {2, 1, 3} : FALSE}, (3 .. 7)} : (~([a |-> 1, b |-> TRUE] = [a |-> 1]))} : ((CHOOSE r \in [a : {1}] : TRUE) = [[[a |-> 1] EXCEPT !.a = @ + 2147483647] EXCEPT !.a = {7 : b1573 \in SUBSET {1}}])))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2178:0 Overflow when computing 1+2147483647
    2178:0 Overflow when computing 1+2147483647
---*)

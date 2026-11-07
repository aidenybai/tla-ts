(*---
description: Evaluates a random record expression, seed 262, number 4522.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04522 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[[[a |-> 2147483647, b |-> TRUE] EXCEPT !.a = @ + CASE FALSE -> -1 [] OTHER -> 2] EXCEPT !.a = @ + ([[a |-> 1, b |-> TRUE] EXCEPT !.a = @ + 2147483647]).a] EXCEPT !.a = ((CHOOSE r \in [a : {1, 2} \cap {2}] : TRUE)).a])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2178:0 Overflow when computing 2147483647+2
    2178:0 Overflow when computing 2147483647+2
---*)

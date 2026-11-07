(*---
description: Evaluates a random int expression, seed 262, number 9380.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09380 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((CHOOSE b14554 \in {(IF FALSE THEN b14555 ELSE 2147483647 \div ([a |-> 1]).a) : b14555 \in DOMAIN (0 :> 0)} : ([[a |-> b14554, b |-> FALSE] EXCEPT !.a = @ + (b14554 + 0)] = [[[a |-> 1] EXCEPT !.a = @ + 0] EXCEPT !.a = @ + ([a |-> 1] % -1)])))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2178:0 Overflow when computing 2147483647+2147483647
    2178:0 Overflow when computing 2147483647+2147483647
---*)

(*---
description: Evaluates a random seq expression, seed 262, number 5361.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05361 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Append(Tail(Append((<<>> \o <<3, 1, 2>>), ([x \in 1..2 |-> x])[1])), ((Cardinality(SUBSET {1}) * (-2147483647)) * Len([<<1>> EXCEPT ![1] = [x \in 1..2 |-> x]]))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2178:0 Overflow when computing 2*-2147483647
    2178:0 Overflow when computing 2*-2147483647
---*)

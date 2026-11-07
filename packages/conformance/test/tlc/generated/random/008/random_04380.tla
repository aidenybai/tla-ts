(*---
description: Evaluates a random bool expression, seed 262, number 4380.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04380 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((({7, -1} \subseteq (7 .. 3)) \cup (DOMAIN <<5, 6>> \cup {-1, 7})) \subseteq ((LET b6896 == 2147483647 IN b6896 % Cardinality(Nat)) .. ((2147483647 * 0) \div CASE TRUE -> 7 [] OTHER -> -1))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2181:0 Attempted to compute cardinality of the value
    Nat
    2181:0 Attempted to compute cardinality of the value
    Nat
---*)

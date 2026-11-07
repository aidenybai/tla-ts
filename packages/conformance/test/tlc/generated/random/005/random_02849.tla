(*---
description: Evaluates a random int expression, seed 262, number 2849.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02849 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([b4517 \in UNION {CASE TRUE -> <<1>> [] OTHER -> 7, {3, 1}} |-> SubSeq((<<1>> \o <<1>>), Cardinality(SUBSET {1}), (-b4517))])[(Cardinality(UNION {{1, 2}, {1, 2}}) % ((-1 * 2) % Head(<<1, 2>>)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2169:0 The second argument of % should be a positive number, but instead it is:
    0
    2169:0 The second argument of % should be a positive number, but instead it is:
    0
---*)

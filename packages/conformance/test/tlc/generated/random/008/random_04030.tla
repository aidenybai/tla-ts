(*---
description: Evaluates a random set expression, seed 262, number 4030.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04030 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((((3 * 0) - (7 % 0)) .. (LET b6333 == -1 IN 2147483647)[Cardinality(Nat)]) \ <<CASE ({1} \subseteq 1..3) -> LET b6334 == 2147483647 IN 1 [] OTHER -> (<<3, 1, 2>> - 7), Cardinality(({} \cup {x \in 1..3 : x > 1}))>>))
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

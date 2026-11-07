(*---
description: Evaluates a random seq expression, seed 262, number 6519.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06519 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Append([b10018 \in ({7, 2} \ (Nat \cup SUBSET {1})) |-> Head(<<b10018, 2147483647>>)], (-(((1 :> 2)).a \div ([x \in Nat |-> x + 1])[0]))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06519 failed.
    Attempted to check equality of integer 1 with non-integer:
    "a"
---*)

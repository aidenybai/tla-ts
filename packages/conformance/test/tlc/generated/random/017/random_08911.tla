(*---
description: Evaluates a random set expression, seed 262, number 8911.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08911 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((((-1 .. -1) \cap {1 : b13808 \in SUBSET {1}}) \cup {IF FALSE THEN -1 ELSE 2147483647 : b13809 \in DOMAIN <<5, 6>>}) \cup {b13810 \in ((0 + -1) .. (3 % -1)) : (Append(<<3, 1, 2>>, b13810) = [b13811 \in {x \in 1..3 : x > 1} |-> [x \in Nat |-> x + 1]])}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08911 failed.
    2169:0 The second argument of % should be a positive number, but instead it is:
    -1
---*)

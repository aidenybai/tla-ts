(*---
description: Evaluates a random bool expression, seed 262, number 4420.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04420 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((({2 : b6955 \in {}} \cup (0 .. 2147483647)) \cup {(<<5, 6>>)[7] : b6956 \in UNION {{1}, {2, 1, 3}}}) \subseteq ((CHOOSE b6957 \in ({1} \ 1..3) : (b6957 \in {1, 2})) .. (IF FALSE THEN 1 ELSE -1 * (2147483647 \div [a |-> 1])))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04420 failed.
    Attempted to access index 7 of tuple
    <<5, 6>>
    which is out of bounds.
---*)

(*---
description: Evaluates a random bool expression, seed 262, number 5785.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05785 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((Cardinality(2..1) % LET b8915 == 7 IN b8915) .. CASE (SUBSET {1} \subseteq {1, 2}) -> (-2) [] OTHER -> (CHOOSE b8916 \in {x \in 1..3 : x > 1} : FALSE)) \subseteq (((SUBSET {1} \ SUBSET {1}) \cup {b8917 \in Nat : FALSE}) \cap UNION {{7 : b8918 \in SUBSET {1}}, (-1 .. 2147483647)})))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05785 failed.
    Attempted to check equality of integer 1 with non-integer:
    {}
---*)

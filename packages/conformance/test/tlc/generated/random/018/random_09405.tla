(*---
description: Evaluates a random set expression, seed 262, number 9405.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09405 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(UNION {{CASE (2147483647 < 2147483647) -> LET b14590 == 2 IN -1 [] OTHER -> (CHOOSE b14591 \in 1..3 : TRUE), CASE (Nat \subseteq {1}) -> CASE FALSE -> <<1>> [] OTHER -> -1 [] OTHER -> (2 \div 7)}, ((SortSeq(<<1, 2>>, LAMBDA p, q : p < q) .. (FALSE \div 3)) \cup (DOMAIN (1 :> 2) \cup DOMAIN [x \in 1..2 |-> x]))})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09405 failed.
    Attempted to evaluate an expression of form S \subseteq T, but S was not enumerable.
    line 14, col 131 to line 14, col 147 of module random_09405
---*)

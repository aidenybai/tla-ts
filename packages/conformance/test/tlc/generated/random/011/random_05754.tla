(*---
description: Evaluates a random bool expression, seed 262, number 5754.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05754 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((UNION {{([a |-> 1]).a : b8858 \in ({2, 1, 3} \ {})}, {b8859 \in (1..3 \cup {2, 1, 3}) : (\E b8860 \in Nat : (1 :> 2))}} = (((0 + 7) - (3 - 2147483647)) .. CASE (<<1>> = (1 :> 2)) -> ([x \in Nat |-> x + 1])[3] [] OTHER -> (7 * 1))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05754 failed.
    TLC encountered the non-enumerable quantifier bound
    Nat
    line 14, col 119 to line 14, col 121 of module random_05754
    The set Nat contains infinitely many elements. As a result, TLC cannot evaluate expressions that
    universally (\A) or existentially (\E) quantify over Nat, because this would require checking an
    infinite number of cases. Note that TLC handles set membership like T \subseteq Nat for any finite set T.
---*)

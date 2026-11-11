(*---
description: Evaluates a random bool expression, seed 262, number 9721.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09721 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((({b15083 : b15083 \in Nat} \ UNION {{2, 1, 3}, 2..1}) = (SelectSeq(<<3, 1, 2>>, LAMBDA e : e > 0) \ {2147483647, 2})) /\ ((\A b15084 \in {7 : b15085 \in 1..3} : (SUBSET {1} \subseteq 2..1)) \/ [a |-> IF TRUE THEN -1 ELSE 7, b |-> (FALSE <=> TRUE)])))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09721 failed.
    TLC encountered the non-enumerable quantifier bound
    Nat
    line 14, col 40 to line 14, col 42 of module random_09721
    The set Nat contains infinitely many elements. As a result, TLC cannot evaluate expressions that
    universally (\A) or existentially (\E) quantify over Nat, because this would require checking an
    infinite number of cases. Note that TLC handles set membership like T \subseteq Nat for any finite set T.
---*)

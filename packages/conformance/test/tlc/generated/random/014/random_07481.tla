(*---
description: Evaluates a random set expression, seed 262, number 7481.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07481 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((UNION {UNION {{2, 1, 3}, {x \in 1..3 : x > 1}}, UNION {{1}, 2..1}} \ {b11527 \in {b11528 : b11528 \in Nat} : (7 \in SUBSET {1})}) \ ({b11529 \in (Nat \cap {1}) : (FALSE <=> FALSE)} \cap DOMAIN [b11530 \in SUBSET {1} |-> 2])))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07481 failed.
    TLC encountered the non-enumerable quantifier bound
    Nat
    line 14, col 120 to line 14, col 122 of module random_07481
    The set Nat contains infinitely many elements. As a result, TLC cannot evaluate expressions that
    universally (\A) or existentially (\E) quantify over Nat, because this would require checking an
    infinite number of cases. Note that TLC handles set membership like T \subseteq Nat for any finite set T.
---*)

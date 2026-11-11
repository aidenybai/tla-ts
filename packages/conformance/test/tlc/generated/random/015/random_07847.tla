(*---
description: Evaluates a random seq expression, seed 262, number 7847.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07847 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SelectSeq([<<(-1 \div 1), ({} \ Nat)>> EXCEPT ![1] = Cardinality({-1 : b12123 \in Nat})], LAMBDA e : e > 0))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07847 failed.
    TLC encountered the non-enumerable quantifier bound
    Nat
    line 14, col 98 to line 14, col 100 of module random_07847
    The set Nat contains infinitely many elements. As a result, TLC cannot evaluate expressions that
    universally (\A) or existentially (\E) quantify over Nat, because this would require checking an
    infinite number of cases. Note that TLC handles set membership like T \subseteq Nat for any finite set T.
---*)

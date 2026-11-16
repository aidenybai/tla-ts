(*---
description: Evaluates a random set expression, seed 262, number 4317.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04317 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(UNION {UNION {{b6806 \in (SUBSET {1} \ {1, 2}) : (b6806 < (1 :> 2))}, ({b6807 : b6807 \in Nat} \cap ({1} \cap {1}))}, (UNION {(1 .. 7), ({1, 2} \ 2..1)} \cup UNION {({1} \cap {1}), (2..1 \cap SUBSET {1})})})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04317 failed.
    TLC encountered the non-enumerable quantifier bound
    Nat
    line 14, col 106 to line 14, col 108 of module random_04317
    The set Nat contains infinitely many elements. As a result, TLC cannot evaluate expressions that
    universally (\A) or existentially (\E) quantify over Nat, because this would require checking an
    infinite number of cases. Note that TLC handles set membership like T \subseteq Nat for any finite set T.
---*)

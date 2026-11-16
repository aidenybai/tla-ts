(*---
description: Evaluates a random bool expression, seed 262, number 5823.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05823 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([b8977 \in UNION {{1 : b8978 \in Nat}, (CHOOSE b8979 \in 2..1 : FALSE)} |-> ((b8977 + b8977) - (7 \div 1))] \/ (Append(SubSeq(<<3, 1, 2>>, 1, 0), ([a |-> 1]).a) = (CHOOSE f \in [{1, 2} \cap {2} -> {1, 2} \ {1}] : TRUE))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05823 failed.
    TLC encountered the non-enumerable quantifier bound
    Nat
    line 14, col 50 to line 14, col 52 of module random_05823
    The set Nat contains infinitely many elements. As a result, TLC cannot evaluate expressions that
    universally (\A) or existentially (\E) quantify over Nat, because this would require checking an
    infinite number of cases. Note that TLC handles set membership like T \subseteq Nat for any finite set T.
---*)

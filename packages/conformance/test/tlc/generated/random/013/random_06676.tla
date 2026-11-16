(*---
description: Evaluates a random function expression, seed 262, number 6676.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06676 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([b10235 \in ({b10236 : b10236 \in Nat} \cap (SUBSET {1} \cap TRUE)) |-> (-([a |-> 1]).a)] @@ [b10237 \in UNION {(2..1 \cap <<1, 2>>), ({1, 2} \ {2, 1, 3})} |-> (((1 :> 2))[2] + (1 % 3))]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06676 failed.
    TLC encountered the non-enumerable quantifier bound
    Nat
    line 14, col 51 to line 14, col 53 of module random_06676
    The set Nat contains infinitely many elements. As a result, TLC cannot evaluate expressions that
    universally (\A) or existentially (\E) quantify over Nat, because this would require checking an
    infinite number of cases. Note that TLC handles set membership like T \subseteq Nat for any finite set T.
---*)

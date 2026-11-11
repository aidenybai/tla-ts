(*---
description: Evaluates a random set expression, seed 262, number 3393.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03393 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({Head([b5391 \in (CHOOSE f \in [2..1 -> {}] : TRUE) |-> (-1)]) : b5390 \in ((({1} \cup {x \in 1..3 : x > 1}) \cap (Nat \ {})) \ {(2147483647 \div b5392) : b5392 \in {2147483647 : b5393 \in Nat}})})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03393 failed.
    TLC encountered the non-enumerable quantifier bound
    Nat
    line 14, col 205 to line 14, col 207 of module random_03393
    The set Nat contains infinitely many elements. As a result, TLC cannot evaluate expressions that
    universally (\A) or existentially (\E) quantify over Nat, because this would require checking an
    infinite number of cases. Note that TLC handles set membership like T \subseteq Nat for any finite set T.
---*)

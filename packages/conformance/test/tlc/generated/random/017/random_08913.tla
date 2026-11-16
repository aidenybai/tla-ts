(*---
description: Evaluates a random bool expression, seed 262, number 8913.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08913 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((\E b13813 \in {b13814 \in ((-1 .. 7) \cup UNION {{1, 2}, {1, 2}}) : (\A b13815 \in DOMAIN [x \in Nat |-> x + 1] : (2 < 2))} : ((<<b13813, [x \in 1..2 |-> x]>> = (<<5, 6>> @@ [x \in 1..2 |-> x])) <=> ((3 - -1) = (<<5, 6>>)[b13813]))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08913 failed.
    TLC encountered the non-enumerable quantifier bound
    Nat
    line 14, col 100 to line 14, col 127 of module random_08913
    The set Nat contains infinitely many elements. As a result, TLC cannot evaluate expressions that
    universally (\A) or existentially (\E) quantify over Nat, because this would require checking an
    infinite number of cases. Note that TLC handles set membership like T \subseteq Nat for any finite set T.
---*)

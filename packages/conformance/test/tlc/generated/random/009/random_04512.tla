(*---
description: Evaluates a random set expression, seed 262, number 4512.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04512 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({(\A b7088 \in DOMAIN [x \in Nat |-> x + 1] : ({1} = {2, 1, 3})), ((CHOOSE r \in [a : 1..2] : TRUE)).a} \ (((SUBSET {1} \ Nat) \cup UNION {Nat, {}}) \ UNION {(1 .. 3), (1..3 \ {1, 2})})))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04512 failed.
    TLC encountered the non-enumerable quantifier bound
    Nat
    line 14, col 32 to line 14, col 59 of module random_04512
    The set Nat contains infinitely many elements. As a result, TLC cannot evaluate expressions that
    universally (\A) or existentially (\E) quantify over Nat, because this would require checking an
    infinite number of cases. Note that TLC handles set membership like T \subseteq Nat for any finite set T.
---*)

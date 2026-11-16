(*---
description: Evaluates a random set expression, seed 262, number 4430.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04430 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((Cardinality({1, 2}) .. ([a |-> 1, b |-> TRUE]).a) \cap DOMAIN (-1 :> 2)) \cap UNION {(({x \in 1..3 : x > 1} \cap {2, 1, 3}) \cap {b6970 : b6970 \in Nat}), {b6971 \in {b6972 : b6972 \in Nat} : ([a |-> 1, b |-> TRUE] = <<1>>)}}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04430 failed.
    TLC encountered the non-enumerable quantifier bound
    Nat
    line 14, col 167 to line 14, col 169 of module random_04430
    The set Nat contains infinitely many elements. As a result, TLC cannot evaluate expressions that
    universally (\A) or existentially (\E) quantify over Nat, because this would require checking an
    infinite number of cases. Note that TLC handles set membership like T \subseteq Nat for any finite set T.
---*)

(*---
description: Evaluates a random set expression, seed 262, number 905.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00905 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((Cardinality(SUBSET {1}) = ([a |-> 1, b |-> TRUE]).a) * CASE (\A b1455 \in Nat : FALSE) -> CASE 1..3 -> 2147483647 [] OTHER -> 2 [] OTHER -> (-2147483647)) .. IF (~(\A b1456 \in {1} : TRUE)) THEN IF ([a |-> 1] = [a |-> 1]) THEN (1 \div {}) ELSE Len(<<1>>) ELSE Head(SubSeq(<<1>>, 7, 2147483647))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00905 failed.
    TLC encountered the non-enumerable quantifier bound
    Nat
    line 14, col 93 to line 14, col 95 of module random_00905
    The set Nat contains infinitely many elements. As a result, TLC cannot evaluate expressions that
    universally (\A) or existentially (\E) quantify over Nat, because this would require checking an
    infinite number of cases. Note that TLC handles set membership like T \subseteq Nat for any finite set T.
---*)

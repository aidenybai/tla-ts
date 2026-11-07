(*---
description: Evaluates a random set expression, seed 262, number 2624.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02624 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({CASE (\E b4130 \in (b4129 .. {1, 2}) : (\A b4131 \in 2..1 : TRUE)) -> Cardinality((SUBSET {1} \cap {1})) [] OTHER -> ((<<5, 6>> @@ [x \in 1..2 |-> x]))[(<<5, 6>>)[0]] : b4129 \in UNION {{b4132 \in ({x \in 1..3 : x > 1} \cup 1..3) : (<<1>> = [x \in 1..2 |-> x])}, {([x \in Nat |-> x + 1])[b4133] : b4133 \in {2..1 : b4134 \in Nat}}}})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02624 failed.
    TLC encountered the non-enumerable quantifier bound
    Nat
    line 14, col 342 to line 14, col 344 of module random_02624
    The set Nat contains infinitely many elements. As a result, TLC cannot evaluate expressions that
    universally (\A) or existentially (\E) quantify over Nat, because this would require checking an
    infinite number of cases. Note that TLC handles set membership like T \subseteq Nat for any finite set T.
---*)

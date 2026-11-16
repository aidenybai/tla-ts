(*---
description: Evaluates a random function expression, seed 262, number 2959.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02959 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([b4690 \in {b4691 \in IF ({2, 1, 3} = {1}) THEN (-1 \div 1) ELSE Cardinality(SUBSET {1}) : ((Nat < b4691) \/ (b4691 < b4691))} |-> LET b4692 == (-(b4690 * b4690)) IN SortSeq((CHOOSE b4693 \in 2..1 : FALSE), LAMBDA p, q : p < q)])
====

(*--- recorded
all:
  exit: 0
  transcript: "| [b4690 \\in {b4691 \\in 2 : <expression line 14, col 108 to line 14, col 139 of module random_02959> } |-> <expression line 14, col 147 to line 14, col 242 of module random_02959>]"
---*)

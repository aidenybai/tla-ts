(*---
description: Evaluates a random int expression, seed 262, number 3117.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03117 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(CASE ((SelectSeq(<<>>, LAMBDA e : e > 0) = ((1 :> 2) @@ [x \in Nat |-> x + 1])) <=> ((2..1 = {x \in 1..3 : x > 1}) <=> (0 :> 7))) -> (-IF ({1, 2} \subseteq 2..1) THEN (CHOOSE b4980 \in {} : FALSE) ELSE ([a |-> 1, b |-> TRUE] * -1)) [] OTHER -> ((Cardinality(SUBSET {1}) - (3 \div 3)) + (SubSeq(<<1>>, 2, 7) = (CHOOSE f \in [1..2 -> {1, 2}] : TRUE))))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops * in block line 14, col 241 to line 14, col 241 of module random_03117 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 219.
    | Expression starting at line 14, column 219.
    | ExtendableExpr starting at line 14, column 218.
    | Expression starting at line 14, column 218.
    | IF THEN ELSE starting at line 14, column 151.
    | Fatal errors while parsing TLA+ spec in file random_03117
    | In module random_03117
    | Could not parse module random_03117 from file random_03117.tla
    | *** Errors: 1
    | In module random_03117
    | Could not parse module random_03117 from file random_03117.tla
    3002:1 Parsing or semantic analysis failed.
---*)

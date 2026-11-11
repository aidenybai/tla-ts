(*---
description: Evaluates a random set expression, seed 262, number 6384.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06384 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({(CHOOSE b9817 \in DOMAIN ([x \in 1..2 |-> x] @@ [x \in 1..2 |-> x]) : (([a |-> 1]).a < Cardinality({1}))), LET b9818 == CASE (\E b9819 \in {x \in 1..3 : x > 1} : FALSE) -> Cardinality(SUBSET {1}) [] OTHER -> ([x \in 1..2 |-> x])[2] IN ((CHOOSE f \in [2..1 -> 1..2] : TRUE))[(--1)]})
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | Encountered "1" at line 14, column 294 and token "--" 
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 291.
    | Expression starting at line 14, column 291.
    | Some [] Form starting at line 14, column 290.
    | ExtendableExpr starting at line 14, column 252.
    | Expression starting at line 14, column 252.
    | Fatal errors while parsing TLA+ spec in file random_06384
    | In module random_06384
    | Could not parse module random_06384 from file random_06384.tla
    | *** Errors: 1
    | In module random_06384
    | Could not parse module random_06384 from file random_06384.tla
    3002:1 Parsing or semantic analysis failed.
---*)

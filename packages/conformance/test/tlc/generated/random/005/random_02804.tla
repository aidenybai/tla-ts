(*---
description: Evaluates a random function expression, seed 262, number 2804.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02804 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((CHOOSE b4444 \in {b4445 \in SUBSET {1} : TRUE} : (TRUE /\ TRUE)) + ({b4446 : b4446 \in {x \in 1..3 : x > 1}} = (Nat \cap SUBSET {1}))) :> {Cardinality({b4447 \in {x \in 1..3 : x > 1} : FALSE}), LET b4448 == (7 + 1) IN (--1)}))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | Encountered "1" at line 14, column 240 and token "--" 
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 237.
    | Expression starting at line 14, column 237.
    | Case Other Arm starting at line 14, column 213.
    | Expression starting at line 14, column 213.
    | Some { } form starting at line 14, column 157.
    | Fatal errors while parsing TLA+ spec in file random_02804
    | In module random_02804
    | Could not parse module random_02804 from file random_02804.tla
    | *** Errors: 1
    | In module random_02804
    | Could not parse module random_02804 from file random_02804.tla
    3002:1 Parsing or semantic analysis failed.
---*)

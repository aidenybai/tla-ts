(*---
description: Evaluates a random set expression, seed 262, number 2221.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02221 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((({(--1), (FALSE /\ TRUE)} \cap (CASE TRUE -> 1 [] OTHER -> 7 .. (3 + 7))) \cap ((([a |-> 1]).a % LET b3497 == 3 IN b3497) .. (Cardinality({1}) * (1 :> 2147483647)))))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | Encountered "1" at line 14, column 22 and token "--" 
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 19.
    | Expression starting at line 14, column 19.
    | Some { } form starting at line 14, column 18.
    | ExtendableExpr starting at line 14, column 18.
    | Expression starting at line 14, column 18.
    | Fatal errors while parsing TLA+ spec in file random_02221
    | In module random_02221
    | Could not parse module random_02221 from file random_02221.tla
    | *** Errors: 1
    | In module random_02221
    | Could not parse module random_02221 from file random_02221.tla
    3002:1 Parsing or semantic analysis failed.
---*)

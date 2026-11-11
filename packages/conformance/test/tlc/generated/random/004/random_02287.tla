(*---
description: Evaluates a random set expression, seed 262, number 2287.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02287 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((DOMAIN [b3605 \in {b3606 \in {1} : TRUE} |-> (--1)] \ {((2 \div 0) * (-b3607)) : b3607 \in {(b3608 * b3608) : b3608 \in {b3609 \in 2..1 : FALSE}}}))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | Encountered "1" at line 14, column 65 and token "--" 
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 62.
    | Expression starting at line 14, column 62.
    | Some [] Form starting at line 14, column 24.
    | ExtendableExpr starting at line 14, column 24.
    | Expression starting at line 14, column 17.
    | Fatal errors while parsing TLA+ spec in file random_02287
    | In module random_02287
    | Could not parse module random_02287 from file random_02287.tla
    | *** Errors: 1
    | In module random_02287
    | Could not parse module random_02287 from file random_02287.tla
    3002:1 Parsing or semantic analysis failed.
---*)

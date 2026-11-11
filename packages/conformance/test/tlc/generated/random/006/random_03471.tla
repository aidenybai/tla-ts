(*---
description: Evaluates a random bool expression, seed 262, number 3471.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03471 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((SubSeq(<<3, 1, 2>>, 3, 2147483647) = (7 :> 2147483647)) <=> (([a |-> 1] = [a |-> 1, b |-> TRUE]) /\ (<<3, 1, 2>> = (1 :> 2)))) => (((<<5, 6>>)[2147483647] \div (7 + 1)) < ((0 \div [a |-> 1, b |-> TRUE]) < (--1)))))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | Encountered "1" at line 14, column 227 and token "--" 
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 224.
    | ExtendableExpr starting at line 14, column 191.
    | Expression starting at line 14, column 191.
    | ExtendableExpr starting at line 14, column 190.
    | ExtendableExpr starting at line 14, column 150.
    | Fatal errors while parsing TLA+ spec in file random_03471
    | In module random_03471
    | Could not parse module random_03471 from file random_03471.tla
    | *** Errors: 1
    | In module random_03471
    | Could not parse module random_03471 from file random_03471.tla
    3002:1 Parsing or semantic analysis failed.
---*)

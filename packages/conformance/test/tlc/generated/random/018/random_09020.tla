(*---
description: Evaluates a random set expression, seed 262, number 9020.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09020 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Head(Tail(Tail(<<1, 2>>))) .. ([(CHOOSE r \in [a : {1, 2}] : TRUE) EXCEPT !.a = @ + (--1)]).a))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | Encountered "1" at line 14, column 104 and token "--" 
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 101.
    | ExtendableExpr starting at line 14, column 97.
    | Expression starting at line 14, column 97.
    | Except Spec starting at line 14, column 91.
    | Some [] Form starting at line 14, column 48.
    | Fatal errors while parsing TLA+ spec in file random_09020
    | In module random_09020
    | Could not parse module random_09020 from file random_09020.tla
    | *** Errors: 1
    | In module random_09020
    | Could not parse module random_09020 from file random_09020.tla
    3002:1 Parsing or semantic analysis failed.
---*)

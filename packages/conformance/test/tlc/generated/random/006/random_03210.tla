(*---
description: Evaluates a random bool expression, seed 262, number 3210.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03210 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((((--1) :> (1 % -1)))[(Len(<<3, 1, 2>>) * ([a |-> 1, b |-> TRUE]).a)] \in [(CHOOSE r \in [a : {0} \cup {1}] : TRUE) EXCEPT !.a = @ + ((-0) * IF FALSE THEN 7 ELSE 1)]))
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
    | ExtendableExpr starting at line 14, column 18.
    | Expression starting at line 14, column 18.
    | ExtendableExpr starting at line 14, column 17.
    | Fatal errors while parsing TLA+ spec in file random_03210
    | In module random_03210
    | Could not parse module random_03210 from file random_03210.tla
    | *** Errors: 1
    | In module random_03210
    | Could not parse module random_03210 from file random_03210.tla
    3002:1 Parsing or semantic analysis failed.
---*)

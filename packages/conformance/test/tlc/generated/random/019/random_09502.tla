(*---
description: Evaluates a random bool expression, seed 262, number 9502.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09502 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((([a |-> 1, b |-> FALSE] = [[a |-> 1] EXCEPT !.a = @ + 1]) /\ ((\E b14760 \in {} : FALSE) /\ (3 \in SUBSET {1}))) <=> (IF (FALSE /\ TRUE) THEN (--1) ELSE Len(<<1>>) = (([a |-> 1]).a \div CASE TRUE -> -1 [] OTHER -> 1))))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | Encountered "1" at line 14, column 163 and token "--" 
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 160.
    | Expression starting at line 14, column 160.
    | IF THEN ELSE starting at line 14, column 136.
    | Expression starting at line 14, column 136.
    | ExtendableExpr starting at line 14, column 135.
    | Fatal errors while parsing TLA+ spec in file random_09502
    | In module random_09502
    | Could not parse module random_09502 from file random_09502.tla
    | *** Errors: 1
    | In module random_09502
    | Could not parse module random_09502 from file random_09502.tla
    3002:1 Parsing or semantic analysis failed.
---*)

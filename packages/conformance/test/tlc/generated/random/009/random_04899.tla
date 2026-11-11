(*---
description: Evaluates a random seq expression, seed 262, number 4899.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04899 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Append(SelectSeq(Tail(<<>>), LAMBDA e : e > 0), ((2147483647 \div 2) * (--1))) \o [Tail((<<3, 1, 2>> \o <<>>)) EXCEPT ![1] = ([[a |-> 1, b |-> TRUE] EXCEPT !.a = 3])[IF <<5, 6>> THEN 7 ELSE 3]]))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | Encountered "1" at line 14, column 91 and token "--" 
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 88.
    | ExtendableExpr starting at line 14, column 66.
    | Expression starting at line 14, column 66.
    | ExtendableExpr starting at line 14, column 65.
    | Expression starting at line 14, column 65.
    | Fatal errors while parsing TLA+ spec in file random_04899
    | In module random_04899
    | Could not parse module random_04899 from file random_04899.tla
    | *** Errors: 1
    | In module random_04899
    | Could not parse module random_04899 from file random_04899.tla
    3002:1 Parsing or semantic analysis failed.
---*)

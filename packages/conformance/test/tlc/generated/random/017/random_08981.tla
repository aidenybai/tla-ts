(*---
description: Evaluates a random seq expression, seed 262, number 8981.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08981 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((SubSeq(SelectSeq(<<1, <<1>>>>, LAMBDA e : e > 0), Head(SubSeq(<<1>>, 7, [a |-> 1, b |-> TRUE])), ([[a |-> 1, b |-> TRUE] EXCEPT !.a = 2147483647]).a) \o Append([[<<1, 2>> EXCEPT ![1] = -1] EXCEPT ![1] = (<<5, 6>>)[7]], ((CHOOSE b13942 \in Nat : [x \in Nat |-> x + 1]) \div (--1)))))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | Encountered "1" at line 14, column 293 and token "--" 
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 290.
    | ExtendableExpr starting at line 14, column 237.
    | Expression starting at line 14, column 237.
    | ExtendableExpr starting at line 14, column 236.
    | Expression starting at line 14, column 236.
    | Fatal errors while parsing TLA+ spec in file random_08981
    | In module random_08981
    | Could not parse module random_08981 from file random_08981.tla
    | *** Errors: 1
    | In module random_08981
    | Could not parse module random_08981 from file random_08981.tla
    3002:1 Parsing or semantic analysis failed.
---*)

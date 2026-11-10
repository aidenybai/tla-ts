(*---
description: Evaluates a random int expression, seed 262, number 3370.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03370 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((Head(SubSeq(<<1>>, 2, 2)) - Len([<<1>> EXCEPT ![1] = 3])) + LET b5349 == [SubSeq(<<1>>, 0, 3) EXCEPT ![1] = (--1)] IN (Len([x \in Nat |-> x + 1]) + Len(<<1, 2>>))))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | Encountered "1" at line 14, column 129 and token "--" 
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 126.
    | Expression starting at line 14, column 126.
    | Except Spec starting at line 14, column 119.
    | Some [] Form starting at line 14, column 91.
    | ExtendableExpr starting at line 14, column 91.
    | Fatal errors while parsing TLA+ spec in file random_03370
    | In module random_03370
    | Could not parse module random_03370 from file random_03370.tla
    | *** Errors: 1
    | In module random_03370
    | Could not parse module random_03370 from file random_03370.tla
    3002:1 Parsing or semantic analysis failed.
---*)

(*---
description: Evaluates a random seq expression, seed 262, number 9358.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09358 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SubSeq((<<(-1), (3 + 2)>> \o SubSeq(Tail(<<3, 1, 2>>), (--1), (FALSE <=> FALSE))), LET b14527 == [[[a |-> 1, b |-> TRUE] EXCEPT !.a = @ + 7] EXCEPT !.a = @ + (2 * 7)] IN (IF TRUE THEN 1 ELSE b14527 + Head(2147483647)), (Cardinality(({1, 2} \cap Nat)) % ((7 * 3) * [[a |-> 1] EXCEPT !.a = 0]))))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | Encountered "1" at line 14, column 74 and token "--" 
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 71.
    | Expression starting at line 14, column 71.
    | Optional Arguments starting at line 14, column 51.
    | Primitive expression starting at line 14, column 45.
    | ExtendableExpr starting at line 14, column 45.
    | Fatal errors while parsing TLA+ spec in file random_09358
    | In module random_09358
    | Could not parse module random_09358 from file random_09358.tla
    | *** Errors: 1
    | In module random_09358
    | Could not parse module random_09358 from file random_09358.tla
    3002:1 Parsing or semantic analysis failed.
---*)
